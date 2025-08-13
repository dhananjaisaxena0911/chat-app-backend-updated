import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { GroupModule } from './group/group.module';
import { GroupMessagesModule } from './group-messages/group-messages.module';
import { BlogsModule } from './blogs/blogs.module';
import { FollowModule } from './follow/follow.module';
import { StoryModule } from './story/story.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, ConversationModule, MessageModule, GroupModule, GroupMessagesModule, ChatModule, BlogsModule, FollowModule, StoryModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
