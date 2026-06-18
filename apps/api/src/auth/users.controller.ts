import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { IsOptional, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class CreateUserBody {
  @IsString() username!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() role?: string;
}

@Controller("users")
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  list() {
    return this.auth.listUsers();
  }

  @Post()
  create(@Body() body: CreateUserBody) {
    return this.auth.createUser(body.username, body.password, body.role);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.auth.deleteUser(id);
  }
}
