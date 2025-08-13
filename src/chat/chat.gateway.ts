import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { MessageService } from "src/message/message.service";
import { GroupMessagesService } from "src/group-messages/group-messages.service";
import { GroupMessageDto } from "src/group/dto/group-message.dto";
import { BlogsService } from "src/blogs/blogs.service";
@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private groupMessageService: GroupMessagesService,
    private prisma: PrismaService,
    private blogService:BlogsService
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client Connected : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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

    this.server.to(body.conversationId).emit("newMessage", message); // emit to room
    return message;
  }

  @SubscribeMessage("joinConversation")
  handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    (client.join(conversationId),
      console.log(
        `Client ${client.id} joined successfully conversation ${conversationId}`,
      ));
  }

  @SubscribeMessage("joinGroup")
  handleJoinGroup(
    @MessageBody() groupId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(groupId);
    console.log(`Client ${client.id} joined Successfully Group ${groupId}`);
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
    this.server.to(body.groupId).emit("newGroupMessage", message);
  }
  @SubscribeMessage("Group-message-recieved")
  async handleGroupMessageRecieved(
    @MessageBody() data: { messageId: string; groupId: string; userId: string },
  ) {
    await this.prisma.groupMessage.update({
      where: { id: data.messageId },
      data: { status: "delivered" },
    });

    this.server.to(data.groupId).emit("GroupId-message-status-update", {
      messageId: data.messageId,
      status: "delivered",
    });
  }

  @SubscribeMessage("Group-message-seen")
  async handleGroupSeen(
    @MessageBody() data: { messageId: string; groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.prisma.groupMessage.update({
      where: {
        id: data.messageId,
      },
      data: {
        status: "seen",
      },
    });
    this.server.to(data.groupId).emit("GroupId-message-status-update", {
      messageId: data.messageId,
      status: "seen",
    });
  }

  @SubscribeMessage("user-typing")
  handleUserTyping(
    @MessageBody() data: { groupId: string; userId: string; username: string },
  ) {
    console.log("🟡 user-typing event received:", data);
    this.server.to(data.groupId).emit("show-typing", {
      userId: data.userId,
      username: data.username,
      groupId: data.groupId,
    });
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
  

  @SubscribeMessage('createBlog')
  async handleCreateBlog(
    @MessageBody() body:{authorId:string;title:string;content:string;imageUrl?:string},
    @ConnectedSocket() client: Socket
  ){
    const dto={
      title:body.title,
      content:body.content,
      imageUrl:body.imageUrl
    };
    const createBlog=await this.blogService.createBlog(body.authorId,dto);

    this.server.emit("newBlog",createBlog);

    return createBlog;
  }
}
