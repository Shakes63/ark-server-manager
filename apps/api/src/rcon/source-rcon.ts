import { EventEmitter } from "events";
import { Socket, connect as netConnect } from "net";

// Source RCON packet types.
const SERVERDATA_AUTH = 3;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_RESPONSE_VALUE = 0;

export interface SourceRconOptions {
  host: string;
  port: number;
  password: string;
  /** Hard cap for a single command's reply (ms). */
  timeout?: number;
  /** Resolve a reply this long after the last packet arrives (multi-packet drain, ms). */
  idle?: number;
}

/**
 * A minimal, lenient Source RCON client.
 *
 * Why not just use rcon-client (which ARK/ASE use)? rcon-client matches a
 * command's reply *strictly* by the response packet's id. Conan Exiles replies
 * with a non-matching id, so rcon-client's auth (which is lenient) succeeds but
 * every command then times out ("Timeout for packet id N"). The game's own
 * gorcon tool talks to the same RCON fine because it's lenient about the id.
 *
 * Since the manager serializes commands per connection (one in-flight at a
 * time), we can safely resolve each command with the next response packet(s),
 * draining any continuation packets after a short idle gap. Exposes the same
 * surface RconService relies on: on(), connect(), send(), end().
 */
export class SourceRcon {
  private readonly emitter = new EventEmitter();
  private socket: Socket | null = null;
  private buffer = Buffer.alloc(0);
  private requestId = 0;
  private authenticated = false;
  // The single in-flight command awaiting a reply (sends are serialized).
  private pending: {
    chunks: string[];
    got: boolean;
    resolve: (out: string) => void;
    reject: (err: Error) => void;
    hard: NodeJS.Timeout;
    idle: NodeJS.Timeout | null;
  } | null = null;
  // Serialize send() so concurrent callers don't cross replies on one socket.
  private queue: Promise<unknown> = Promise.resolve();

  private readonly timeout: number;
  private readonly idleMs: number;

  constructor(private readonly opts: SourceRconOptions) {
    this.timeout = opts.timeout ?? 10_000;
    this.idleMs = opts.idle ?? 250;
  }

  on(event: "error" | "end", listener: (...args: unknown[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  private encode(id: number, type: number, body: string): Buffer {
    const payload = Buffer.from(body, "ascii");
    const buf = Buffer.alloc(payload.length + 14);
    buf.writeInt32LE(payload.length + 10, 0); // id(4) + type(4) + body + 2 null bytes
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    payload.copy(buf, 12);
    return buf; // trailing two null bytes are already zeroed by alloc
  }

  async connect(): Promise<this> {
    if (this.socket) throw new Error("Already connected");
    const socket = (this.socket = netConnect({ host: this.opts.host, port: this.opts.port }));
    socket.setNoDelay(true);

    await new Promise<void>((resolve, reject) => {
      const onErr = (e: Error) => reject(e);
      socket.once("error", onErr);
      socket.once("connect", () => {
        socket.off("error", onErr);
        resolve();
      });
    });

    // Late socket errors must not crash the process — surface them as events and
    // tear down, mirroring how RconService treats rcon-client.
    socket.on("error", (err) => this.emitter.emit("error", err));
    socket.on("close", () => {
      this.failPending(new Error("Connection closed"));
      this.authenticated = false;
      this.socket = null;
      this.emitter.emit("end");
    });
    socket.on("data", (d) => this.onData(d));

    await this.authenticate();
    return this;
  }

  private authenticate(): Promise<void> {
    const id = ++this.requestId;
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("RCON auth timeout")), this.timeout);
      // The auth handler lives until the auth response arrives; onData routes the
      // first AUTH_RESPONSE (or an id of -1 = failure) here.
      this.authResolver = (ok: boolean, packetId: number) => {
        clearTimeout(timer);
        this.authResolver = null;
        if (!ok || packetId === -1) return reject(new Error("RCON authentication failed"));
        this.authenticated = true;
        resolve();
      };
      this.socket!.write(this.encode(id, SERVERDATA_AUTH, this.opts.password));
    });
  }

  private authResolver: ((ok: boolean, packetId: number) => void) | null = null;

  async send(command: string): Promise<string> {
    // Chain onto the queue so only one command is in flight per connection.
    const run = this.queue.then(() => this.sendOne(command));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private sendOne(command: string): Promise<string> {
    if (!this.socket || !this.authenticated) return Promise.reject(new Error("Not connected"));
    const id = ++this.requestId;
    return new Promise<string>((resolve, reject) => {
      const hard = setTimeout(() => {
        this.pending = null;
        reject(new Error(`RCON timeout`));
      }, this.timeout);
      this.pending = { chunks: [], got: false, resolve, reject, hard, idle: null };
      this.socket!.write(this.encode(id, SERVERDATA_EXECCOMMAND, command));
    });
  }

  private onData(d: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, d]);
    // Each packet is a 4-byte little-endian length followed by that many bytes.
    while (this.buffer.length >= 4) {
      const len = this.buffer.readInt32LE(0);
      if (this.buffer.length < len + 4) break;
      const pkt = this.buffer.subarray(4, 4 + len);
      this.buffer = this.buffer.subarray(4 + len);
      const id = pkt.readInt32LE(0);
      const type = pkt.readInt32LE(4);
      const body = pkt.subarray(8, pkt.length - 2).toString("ascii");
      this.handlePacket(id, type, body);
    }
  }

  private handlePacket(id: number, type: number, body: string): void {
    if (!this.authenticated && this.authResolver) {
      // During auth, ignore the optional empty RESPONSE_VALUE preamble; act on
      // the AUTH_RESPONSE (or an explicit -1 failure id).
      if (type === SERVERDATA_AUTH_RESPONSE || id === -1) this.authResolver(id !== -1, id);
      return;
    }
    const p = this.pending;
    if (!p) return; // stray/late packet — nothing waiting
    p.chunks.push(body);
    p.got = true;
    if (p.idle) clearTimeout(p.idle);
    // Resolve once the reply has gone quiet — drains multi-packet responses
    // without relying on a sentinel the server may not echo.
    p.idle = setTimeout(() => {
      clearTimeout(p.hard);
      this.pending = null;
      p.resolve(p.chunks.join(""));
    }, this.idleMs);
  }

  private failPending(err: Error): void {
    const p = this.pending;
    if (!p) return;
    clearTimeout(p.hard);
    if (p.idle) clearTimeout(p.idle);
    this.pending = null;
    p.reject(err);
  }

  async end(): Promise<void> {
    const socket = this.socket;
    if (!socket) return;
    await new Promise<void>((resolve) => {
      socket.once("close", () => resolve());
      socket.end();
    });
  }
}
