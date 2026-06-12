import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

const EmailSubscriptionSchema = z.object({
  email: z.string().email(),
  topics: z.array(z.string()).optional(),
});

const DiscordSubscriptionSchema = z.object({
  webhookUrl: z.string().url(),
  topics: z.array(z.string()).optional(),
});

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('email')
  async email(@Body() body: unknown) {
    const result = EmailSubscriptionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.subscriptionsService.subscribeEmail(
      null,
      result.data.email,
      result.data.topics,
    );
    return { success: true, data };
  }

  @Post('discord')
  async discord(@Body() body: unknown) {
    const result = DiscordSubscriptionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.subscriptionsService.subscribeDiscord(
      null,
      result.data.webhookUrl,
      result.data.topics,
    );
    return { success: true, data };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async mine(@CurrentUser() user: { userId: string }) {
    const data = await this.subscriptionsService.findMine(user.userId);
    return { success: true, data };
  }

  @Delete(':subscriptionId')
  @UseGuards(JwtGuard)
  async unsubscribe(
    @CurrentUser() user: { userId: string },
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const data = await this.subscriptionsService.unsubscribe(subscriptionId, user.userId);
    return { success: true, data };
  }
}
