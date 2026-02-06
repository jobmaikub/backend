import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { InterestsService } from './interests.service';

@Controller('interests')
export class InterestsController {
  constructor(
    private readonly interestsService: InterestsService,
  ) {}

  @Post()
  createInterest(
    @Body() body: { interest_name: string },
  ) {
    return this.interestsService.createInterest(body);
  }

  @Get()
  getInterests() {
    return this.interestsService.getInterests();
  }

  @Get(':id')
  getInterestById(@Param('id') id: string) {
    return this.interestsService.getInterestById(Number(id));
  }

  @Patch(':id')
  updateInterest(
    @Param('id') id: string,
    @Body() body: { interest_name?: string },
  ) {
    return this.interestsService.updateInterest(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  deleteInterest(@Param('id') id: string) {
    return this.interestsService.deleteInterest(
      Number(id),
    );
  }
}
