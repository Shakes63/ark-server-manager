import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { PalModsService } from "./palmods.service";

class FrameworkBody {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() preload?: string;
}

// 512 MB cap — pak mods are usually a few MB; frameworks a few tens.
const UPLOAD = { limits: { fileSize: 512 * 1024 * 1024 } };
type Upload = { originalname: string; buffer: Buffer };

@Controller("servers/:id/palmods")
export class PalModsController {
  constructor(private readonly palmods: PalModsService) {}

  @Get()
  status(@Param("id") id: string) {
    return this.palmods.status(id);
  }

  @Post("paks")
  @UseInterceptors(FileInterceptor("file", UPLOAD))
  addPak(@Param("id") id: string, @UploadedFile() file?: Upload) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.palmods.addPak(id, file.originalname, file.buffer);
  }

  @Delete("paks/:name")
  removePak(@Param("id") id: string, @Param("name") name: string) {
    return this.palmods.removePak(id, name);
  }

  @Patch("framework")
  setFramework(@Param("id") id: string, @Body() body: FrameworkBody) {
    return this.palmods.setFramework(id, body);
  }

  @Post("framework/upload")
  @UseInterceptors(FileInterceptor("file", UPLOAD))
  installFramework(@Param("id") id: string, @UploadedFile() file?: Upload) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.palmods.installFramework(id, file.buffer);
  }

  /** Download + verify + install the pinned UE4SS Linux build, then enable it. */
  @Post("framework/install-ue4ss")
  installUe4ss(@Param("id") id: string) {
    return this.palmods.installFrameworkFromUpstream(id);
  }
}
