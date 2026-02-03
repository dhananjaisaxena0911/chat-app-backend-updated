import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Query } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { BlogsService } from "./blogs.service";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { S3Service } from "src/s3/s3.service";

@Controller("blogs")
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly s3Service: S3Service,
  ) {}
  @Post("create")
  @UseInterceptors(FileInterceptor('image'))
  async createBlog(
    @Body() body: { authorId: string; dto: CreateBlogDto },
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    
    if (file) {
      imageUrl = await this.s3Service.uploadFile(file, 'blogs');
    }

    const dto = typeof body.dto === 'string' ? JSON.parse(body.dto) : body.dto;
    return this.blogsService.createBlog(body.authorId, { ...dto, imageUrl });
  }

  @Get()
  async getAllBlog() {
    const blogs = await this.blogsService.getAllBlogs();
    // Return blogs with signed URLs for images
    const blogsWithSignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        imageUrl: blog.imageUrl ? await this.s3Service.getSignedDownloadUrl(blog.imageUrl) : null,
      }))
    );
    return blogsWithSignedUrls;
  }

  // Get blogs only from users that the current user follows
  @Get("feed")
  async getFollowingBlogs(@Query("userId") userId: string) {
    if (!userId) {
      return [];
    }
    const blogs = await this.blogsService.getFollowingBlogs(userId);
    // Return blogs with signed URLs for images
    const blogsWithSignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        imageUrl: blog.imageUrl ? await this.s3Service.getSignedDownloadUrl(blog.imageUrl) : null,
      }))
    );
    return blogsWithSignedUrls;
  }

  @Get("signed-url")
  async getSignedUrl(@Query("url") url: string) {
    if (!url) {
      return { signedUrl: null };
    }
    const signedUrl = await this.s3Service.getSignedDownloadUrl(url);
    return { signedUrl };
  }

  @Get(":id")
  async getBlogById(@Param("id") id: string) {
    const blog = await this.blogsService.getBlogById(id);
    if (blog && blog.imageUrl) {
      blog.imageUrl = await this.s3Service.getSignedDownloadUrl(blog.imageUrl);
    }
    return blog;
  }
}
