import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { BlogsService } from "./blogs.service";
import { CreateBlogDto } from "./dto/create-blog.dto";

@Controller("blogs")
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}
  @Post("create")
  async createBlog(@Body() body: { authorId: string; dto: CreateBlogDto }) {
    return this.blogsService.createBlog(body.authorId, body.dto);
  }

  @Get()
  async getAllBlog() {
    return this.blogsService.getAllBlogs();
  }

  @Get(":id")
  async getBlogById(@Param("id") id: string) {
    return this.blogsService.getBlogById(id);
  }
}