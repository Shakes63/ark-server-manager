import { Module } from "@nestjs/common";
import { ImageTagsService } from "./image-tags.service";
import { ImageTagsController } from "./image-tags.controller";

@Module({
  controllers: [ImageTagsController],
  providers: [ImageTagsService],
})
export class ImageTagsModule {}
