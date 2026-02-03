import { Injectable } from "@nestjs/common";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

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
    const blogs = await this.prisma.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate signed URLs for all blog images
    const blogsWithSignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        imageUrl: blog.imageUrl 
          ? await this.s3Service.getSignedDownloadUrl(blog.imageUrl)
          : null,
      }))
    );

    return blogsWithSignedUrls;
  }

  // Get blogs only from users that the current user follows (including own posts)
  async getFollowingBlogs(userId: string) {
    const blogs = await this.prisma.blog.findMany({
      where: {
        OR: [
          // Posts from users I follow
          {
            author: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          // My own posts
          {
            authorId: userId,
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate signed URLs for all blog images
    const blogsWithSignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        imageUrl: blog.imageUrl 
          ? await this.s3Service.getSignedDownloadUrl(blog.imageUrl)
          : null,
      }))
    );

    return blogsWithSignedUrls;
  }

  async getBlogById(blogId: string) {
    const blog = await this.prisma.blog.findUnique({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      return null;
    }

    // Generate signed URL for blog image
    return {
      ...blog,
      imageUrl: blog.imageUrl 
        ? await this.s3Service.getSignedDownloadUrl(blog.imageUrl)
        : null,
    };
  }
}
