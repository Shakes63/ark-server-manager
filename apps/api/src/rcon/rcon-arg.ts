/**
 * Sanitize a value interpolated into an RCON/console command. Player names and
 * broadcast messages are attacker-controlled (anyone who joins a server picks
 * their own name): control characters would inject a second command on
 * line-based consoles (7DTD telnet), and double quotes break out of quoted
 * arguments like kickuser "<name>".
 */
const CONTROL_CHARS = new RegExp("[\\x00-\\x1f\\x7f]+", "g");

export function rconArg(value: string): string {
  return value.replace(CONTROL_CHARS, " ").replace(/"/g, "'").trim();
}
