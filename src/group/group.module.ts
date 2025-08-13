import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports:[PrismaModule,ChatModule],
  providers: [GroupService],
  controllers: [GroupController]
})
export class GroupModule {}
