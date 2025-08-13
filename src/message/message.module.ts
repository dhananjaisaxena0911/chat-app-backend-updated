import { Module,forwardRef } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatModule } from 'src/chat/chat.module';
@Module({
  imports: [PrismaModule,forwardRef(()=>ChatModule)],
  providers: [MessageService],
  controllers: [MessageController],
  exports:[MessageService]
})
export class MessageModule {}
