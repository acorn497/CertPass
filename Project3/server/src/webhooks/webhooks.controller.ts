import { BadRequestException, Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { JwtGuard } from '../common/jwt.guard';
import { WebhooksService } from './webhooks.service';

const OutboundWebhookSchema = z.object({
  url: z.string().url(),
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('inbound/:provider')
  async inbound(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, unknown>,
  ) {
    const data = await this.webhooksService.receive(provider, body ?? {}, headers);
    return { success: true, data };
  }

  @Post('outbound/test')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async outbound(@Body() body: unknown) {
    const result = OutboundWebhookSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.webhooksService.send(
      result.data.url,
      result.data.eventType,
      result.data.payload,
    );
    return { success: true, data };
  }
}
