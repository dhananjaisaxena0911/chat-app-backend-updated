import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Inject, forwardRef } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { MessageService } from "src/message/message.service";
import { GroupMessagesService } from "src/group-messages/group-messages.service";
import { GroupMessageDto } from "src/group/dto/group-message.dto";
import { BlogsService } from "src/blogs/blogs.service";
import { ConversationService } from "src/conversation/conversation.service";
import { GroupService } from "src/group/group.service";

// Track online users
const onlineUsers = new Map<string, Set<string>>();

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private groupMessageService: GroupMessagesService,
    @Inject(forwardRef(() => ConversationService))
    private conversationService: ConversationService,
    @Inject(forwardRef(() => GroupService))
    private groupService: GroupService,
    private prisma: PrismaService,
    private blogService: BlogsService
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client Connected : ${client.id}`);
    
    // Track user connection with their userId from handshake
    const userId = client.handshake.auth?.userId;
    if (userId) {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(client.id);
      
      // Broadcast online status
      client.broadcast.emit("user-online-status", {
        userId,
        isOnline: true,
      });
      
      console.log(`User ${userId} is now online`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Find and remove from online users
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          client.broadcast.emit("user-online-status", {
            userId,
            isOnline: false,
          });
          console.log(`User ${userId} is now offline`);
        }
        break;
      }
    }
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody()
    body: {
      senderId: string;
      recipientId: string;
      conversationId: string;
      content: string;
    },
  ) {
    const message = await this.messageService.sendMessage(
      body.senderId,
      body.recipientId,
      body.content,
    );

    this.server.to(body.conversationId).emit("newMessage", message);
    
    // Also emit to recipient's personal room if they're online but not in conversation room
    this.server.to(`user:${body.recipientId}`).emit("new-personal-message", {
      conversationId: body.conversationId,
      message,
    });
    
    return message;
  }

  @SubscribeMessage("joinConversation")
  handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
    console.log(`Client ${client.id} joined conversation ${conversationId}`);
  }

  @SubscribeMessage("joinUserRoom")
  handleJoinUserRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user:${userId}`);
    console.log(`Client ${client.id} joined user room ${userId}`);
  }

  @SubscribeMessage("joinGroup")
  handleJoinGroup(
    @MessageBody() groupId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(groupId);
    console.log(`Client ${client.id} joined group ${groupId}`);
  }

  @SubscribeMessage("sendGroupMessage")
  async handleGroupMessage(
    @MessageBody() body: GroupMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.groupMessageService.sendGroupMessage(
      body.senderId,
      body.groupId,
      body.content,
    );
    // The message is already emitted by the service
    return message;
  }

  @SubscribeMessage("Group-message-recieved")
  async handleGroupMessageRecieved(
    @MessageBody() data: { messageId: string; groupId: string; userId: string },
  ) {
    // Update status to delivered only if not already seen
    const currentMsg = await this.prisma.groupMessage.findUnique({
      where: { id: data.messageId },
    });
    
    if (currentMsg && currentMsg.status !== "seen") {
      await this.prisma.groupMessage.update({
        where: { id: data.messageId },
        data: { status: "delivered" },
      });

      this.server.to(data.groupId).emit("GroupId-message-status-update", {
        messageId: data.messageId,
        status: "delivered",
      });
    }
  }

  @SubscribeMessage("Group-message-seen")
  async handleGroupSeen(
    @MessageBody() data: { messageId: string; groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.prisma.groupMessage.update({
      where: { id: data.messageId },
      data: { status: "seen" },
    });
    
    this.server.to(data.groupId).emit("GroupId-message-status-update", {
      messageId: data.messageId,
      status: "seen",
    });
  }

  @SubscribeMessage("user-typing")
  handleUserTyping(
    @MessageBody() data: { 
      conversationId?: string; 
      groupId?: string; 
      userId: string; 
      username: string;
      type: "dm" | "group";
    },
  ) {
    const roomId = data.type === "group" ? data.groupId : data.conversationId;
    
    if (roomId) {
      this.server.to(roomId).emit("show-typing", {
        userId: data.userId,
        username: data.username,
        conversationId: data.conversationId,
        groupId: data.groupId,
        type: data.type,
      });
    }
  }

  @SubscribeMessage("stop-typing")
  handleStopTyping(
    @MessageBody() data: { 
      conversationId?: string; 
      groupId?: string; 
      userId: string;
      type: "dm" | "group";
    },
  ) {
    const roomId = data.type === "group" ? data.groupId : data.conversationId;
    
    if (roomId) {
      this.server.to(roomId).emit("hide-typing", {
        userId: data.userId,
        conversationId: data.conversationId,
        groupId: data.groupId,
        type: data.type,
      });
    }
  }

  @SubscribeMessage("reactMessage")
  async handleReaction(
    @MessageBody() data: { messageId: string; userId: string; emoji: string },
  ) {
    const saved = await this.messageService.saveReaction(data);

    this.server.to(data.messageId).emit("messageReacted", {
      messageId: data.messageId,
      userId: data.userId,
      emoji: data.emoji,
    });
    
    return saved;
  }

  @SubscribeMessage("removeReaction")
  async handleRemoveReaction(
    @MessageBody() data: { messageId: string; userId: string; emoji: string },
  ) {
    await this.prisma.messageReaction.deleteMany({
      where: {
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
      },
    });

    this.server.to(data.messageId).emit("reaction-removed", {
      messageId: data.messageId,
      userId: data.userId,
      emoji: data.emoji,
    });
    
    return { success: true };
  }

  @SubscribeMessage('createBlog')
  async handleCreateBlog(
    @MessageBody() body:{authorId:string;title:string;content:string;imageUrl?:string},
    @ConnectedSocket() client: Socket
  ){
    const dto = {
      title: body.title,
      content: body.content,
      imageUrl: body.imageUrl
    };
    const createBlog = await this.blogService.createBlog(body.authorId, dto);

    this.server.emit("newBlog", createBlog);

    return createBlog;
  }

  @SubscribeMessage("getUserConversations")
  async handleGetUserConversations(
    @MessageBody() data: { userId: string },
  ) {
    console.log("📋 Fetching conversations for user:", data.userId);
    return this.conversationService.findUserConversation(data.userId);
  }

  @SubscribeMessage("getUserGroups")
  async handleGetUserGroups(
    @MessageBody() data: { userId: string },
  ) {
    console.log("👥 Fetching groups for user:", data.userId);
    const allGroups = await this.groupService.getAllGroups();
    return allGroups.filter(group => 
      group.members.some(member => member.userId === data.userId)
    );
  }

  @SubscribeMessage("getOrCreateConversation")
  async handleGetOrCreateConversation(
    @MessageBody() data: { userId1: string; userId2: string },
  ) {
    console.log("💬 Getting or creating conversation between:", data.userId1, data.userId2);
    
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: { in: [data.userId1, data.userId2] },
          },
        },
        isGroup: false,
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.conversationService.createConversation(
      [data.userId1, data.userId2],
      false
    );
  }

  @SubscribeMessage("getUserByUsername")
  async handleGetUserByUsername(
    @MessageBody() data: { username: string },
  ) {
    console.log("🔍 Searching for user:", data.username);
    
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: data.username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return users;
  }

  @SubscribeMessage("markMessageAsSeen")
  async handleMarkMessageAsSeen(
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    console.log("👁️ Marking message as seen:", data.messageId);
    
    const currentMsg = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });
    
    // Only update if not already seen
    if (currentMsg && currentMsg.status !== "seen") {
      await this.prisma.message.update({
        where: { id: data.messageId },
        data: { status: "seen" },
      });

      // Notify other participants in the conversation
      this.server.to(data.conversationId).emit("message-status-update", {
        messageId: data.messageId,
        status: "seen",
      });
    }

    return { success: true };
  }

  @SubscribeMessage("markConversationSeen")
  async handleMarkConversationSeen(
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    console.log("👁️ Marking all messages in conversation as seen:", data.conversationId);
    
    // Update all unseen messages in the conversation
    await this.prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: data.userId },
        status: { not: "seen" },
      },
      data: { status: "seen" },
    });

    // Notify conversation room
    this.server.to(data.conversationId).emit("conversation-seen", {
      conversationId: data.conversationId,
      seenBy: data.userId,
    });

    return { success: true };
  }

  @SubscribeMessage("getGroupInfo")
  async handleGetGroupInfo(
    @MessageBody() data: { groupId: string },
  ) {
    console.log("📊 Fetching group info:", data.groupId);
    
    return this.prisma.group.findUnique({
      where: { id: data.groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  @SubscribeMessage("getOnlineUsers")
  async handleGetOnlineUsers(
    @MessageBody() data: { userIds: string[] },
  ) {
    const online: string[] = [];
    for (const userId of data.userIds) {
      if (onlineUsers.has(userId)) {
        online.push(userId);
      }
    }
    return { onlineUsers: online };
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId);
  }
}

