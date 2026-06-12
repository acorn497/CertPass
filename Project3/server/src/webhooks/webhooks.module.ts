import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookEvent, WebhookEventSchema } from '../schemas/webhook-event.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, RolesGuard],
  exports: [WebhooksService],
})
export class WebhooksModule {}
