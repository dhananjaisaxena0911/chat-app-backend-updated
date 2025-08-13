import { Injectable } from "@nestjs/common";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class BlogsService {
  constructor(private prisma: PrismaService) {}

  async createBlog(authorId: string, dto: CreateBlogDto) {
    return this.prisma.blog.create({
      data: {
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        authorId: authorId,
      },
    });
  }
  async getAllBlogs() {
    return this.prisma.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getBlogById(authorId:string){
    return this.prisma.blog.findUnique({
        where:{
            id:authorId
        }
    })
  }
}
