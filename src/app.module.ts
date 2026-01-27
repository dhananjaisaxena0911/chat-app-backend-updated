import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { GroupModule } from './group/group.module';
import { GroupMessagesModule } from './group-messages/group-messages.module';
import { BlogsModule } from './blogs/blogs.module';
import { FollowModule } from './follow/follow.module';
import { StoryModule } from './story/story.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from './s3/s3.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), S3Module, AuthModule, UsersModule, PrismaModule, ConversationModule, MessageModule, ChatModule, GroupModule, GroupMessagesModule, BlogsModule, FollowModule, StoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
