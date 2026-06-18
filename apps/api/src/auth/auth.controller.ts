import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { FirstRunBody, LoginBody } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Whether the first-run wizard still needs to run. */
  @Public()
  @Get("status")
  status() {
    return this.auth.status();
  }

  @Public()
  @Post("first-run")
  firstRun(@Body() body: FirstRunBody) {
    return this.auth.firstRun(body);
  }

  @Public()
  @Post("login")
  login(@Body() body: LoginBody) {
    return this.auth.login(body);
  }
}
