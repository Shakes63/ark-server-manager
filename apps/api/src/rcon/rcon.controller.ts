import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RconService } from "./rcon.service";
import { BroadcastBody, PlayerActionBody, RconBody } from "../servers/servers.dto";

@Controller("servers/:id/rcon")
export class RconController {
  constructor(private readonly rcon: RconService) {}

  /** Raw command from the live console. */
  @Post()
  exec(@Param("id") id: string, @Body() body: RconBody) {
    return this.rcon.exec(id, body.command).then((response) => ({ response }));
  }

  @Get("players")
  players(@Param("id") id: string) {
    return this.rcon.listPlayers(id).then((players) => ({ players }));
  }

  @Post("broadcast")
  broadcast(@Param("id") id: string, @Body() body: BroadcastBody) {
    return this.rcon.broadcast(id, body.message).then((response) => ({ response }));
  }

  @Post("save")
  save(@Param("id") id: string) {
    return this.rcon.saveWorld(id).then((response) => ({ response }));
  }

  @Post("kick")
  kick(@Param("id") id: string, @Body() body: PlayerActionBody) {
    return this.rcon.kick(id, body.playerId).then((response) => ({ response }));
  }

  @Post("ban")
  ban(@Param("id") id: string, @Body() body: PlayerActionBody) {
    return this.rcon.ban(id, body.playerId).then((response) => ({ response }));
  }
}
