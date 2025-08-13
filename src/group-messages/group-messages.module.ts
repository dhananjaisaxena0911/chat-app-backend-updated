import { Module } from '@nestjs/common';
import { GroupMessagesService } from './group-messages.service';
import { GroupMessagesController } from './group-messages.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [GroupMessagesService],
  controllers: [GroupMessagesController],
  exports:[GroupMessagesService]
})
export class GroupMessagesModule {}
