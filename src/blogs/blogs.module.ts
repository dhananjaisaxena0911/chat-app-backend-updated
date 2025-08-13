import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [BlogsService],
  controllers: [BlogsController],
  exports:[BlogsService]
})
export class BlogsModule {}
