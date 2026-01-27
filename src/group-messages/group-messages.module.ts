import { Module, forwardRef } from '@nestjs/common';
import { GroupMessagesService } from './group-messages.service';
import { GroupMessagesController } from './group-messages.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports:[
    PrismaModule,
    forwardRef(() => ChatModule),
  ],
  providers: [GroupMessagesService],
  controllers: [GroupMessagesController],
  exports:[GroupMessagesService]
})
export class GroupMessagesModule {}
