import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('courses/:courseId/checkout')
  @UseGuards(JwtGuard)
  async checkout(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.paymentsService.createCheckout(user.userId, courseId);
    return { success: true, data };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async mine(@CurrentUser() user: { userId: string }) {
    const data = await this.paymentsService.mine(user.userId);
    return { success: true, data };
  }

  @Post('confirm')
  @UseGuards(JwtGuard)
  async confirm(
    @CurrentUser() user: { userId: string },
    @Body() body: { paymentKey?: string; orderId?: string; amount?: number },
  ) {
    const data = await this.paymentsService.confirmPayment(
      user.userId,
      body.paymentKey,
      body.orderId,
      body.amount,
    );
    return { success: true, data };
  }
}
