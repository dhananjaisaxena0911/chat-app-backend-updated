import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports:[PrismaModule, S3Module],
  providers: [StoryService],
  controllers: [StoryController]
})
export class StoryModule {}
