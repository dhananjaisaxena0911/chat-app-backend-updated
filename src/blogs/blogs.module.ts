import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports:[PrismaModule, S3Module],
  providers: [BlogsService],
  controllers: [BlogsController],
  exports:[BlogsService]
})
export class BlogsModule {}
