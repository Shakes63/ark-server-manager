import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { Game } from "@ark/shared";
import { PresetsService } from "./presets.service";

class CreatePresetBody {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(Game) game!: Game;
  @IsObject() values!: Record<string, unknown>;
}

@Controller("presets")
export class PresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get()
  list(@Query("game") game?: Game) {
    return this.presets.list(game);
  }

  @Post()
  create(@Body() body: CreatePresetBody) {
    return this.presets.create(body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.presets.remove(id);
  }
}
