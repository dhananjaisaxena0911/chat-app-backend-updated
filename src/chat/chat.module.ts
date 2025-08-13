import { Module,forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessageModule } from 'src/message/message.module';
import { BlogsModule } from 'src/blogs/blogs.module';
import { GroupMessagesModule } from 'src/group-messages/group-messages.module';
@Module({
    imports:[forwardRef(()=>MessageModule),GroupMessagesModule,PrismaModule,BlogsModule],
    providers:[ChatGateway],
    exports:[ChatGateway]
})
export class ChatModule {}
