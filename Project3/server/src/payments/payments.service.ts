import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { appLogger } from '../common/app-logger';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createCheckout(userId: string, courseId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (!course.isPublished || course.status !== 'approved') {
      throw new BadRequestException('승인된 강의만 결제할 수 있습니다');
    }

    const amount = Math.max(course.price ?? 0, 0);
    if (amount <= 0) {
      await this.ensureEnrollment(userId, courseId);
      const payment = await this.paymentModel.create({
        user_id: new Types.ObjectId(userId),
        course_id: new Types.ObjectId(courseId),
        provider: 'sandbox',
        status: 'paid',
        amount,
        currency: process.env.PAYMENT_CURRENCY ?? 'KRW',
        orderId: `free_${courseId}_${Date.now()}`,
        providerSessionId: null,
        checkoutUrl: null,
      });
      return this.toCheckoutResponse(
        payment,
        course.title,
        await this.userModel.findById(userId).select('email name').lean(),
        process.env.CLIENT_URL ?? 'http://localhost:5173',
        courseId,
      );
    }
    const currency = process.env.PAYMENT_CURRENCY ?? 'KRW';
    const orderId = `order_${courseId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const orderName = course.title;
    const user = await this.userModel.findById(userId).select('email name').lean();
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

    if (!process.env.TOSS_SECRET_KEY) {
      const payment = await this.paymentModel.create({
        user_id: new Types.ObjectId(userId),
        course_id: new Types.ObjectId(courseId),
        provider: 'sandbox',
        status: 'paid',
        amount,
        currency,
        orderId,
        providerSessionId: orderId,
        checkoutUrl: `${clientUrl}/courses/${courseId}?payment=sandbox&orderId=${encodeURIComponent(orderId)}`,
      });
      await this.ensureEnrollment(userId, courseId);
      appLogger.info('sandbox_checkout_created', { paymentId: String(payment._id) });
      return this.toCheckoutResponse(payment, orderName, user, clientUrl, courseId);
    }

    const payment = await this.paymentModel.create({
      user_id: new Types.ObjectId(userId),
      course_id: new Types.ObjectId(courseId),
      provider: 'toss',
      status: 'pending',
      amount,
      currency,
      orderId,
      providerSessionId: orderId,
      checkoutUrl: null,
    });

    appLogger.info('toss_checkout_created', { paymentId: String(payment._id), orderId });
    return this.toCheckoutResponse(payment, orderName, user, clientUrl, courseId);
  }

  async confirmPayment(
    userId: string,
    paymentKey?: string,
    orderId?: string,
    amount?: number,
  ) {
    if (!paymentKey || !orderId || typeof amount !== 'number') {
      throw new BadRequestException('paymentKey, orderId, amount가 필요합니다');
    }

    const payment = await this.paymentModel.findOne({
      orderId,
      user_id: new Types.ObjectId(userId),
    });
    if (!payment) throw new NotFoundException('결제 주문을 찾을 수 없습니다');
    if (payment.amount !== amount) {
      throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다');
    }

    if (payment.status === 'paid') {
      if (payment.paymentKey && payment.paymentKey !== paymentKey) {
        throw new BadRequestException('이미 다른 결제키로 승인된 주문입니다');
      }
      await this.ensureEnrollment(userId, String(payment.course_id));
      return payment;
    }

    if (!process.env.TOSS_SECRET_KEY) {
      payment.status = 'paid';
      payment.paymentKey = paymentKey;
      payment.providerSessionId = paymentKey;
      await payment.save();
      await this.ensureEnrollment(userId, String(payment.course_id));
      return payment;
    }

    const tossPayment = await this.requestTossConfirm(paymentKey, orderId, amount);
    if (typeof tossPayment.amount === 'number' && tossPayment.amount !== payment.amount) {
      throw new BadRequestException('승인된 결제 금액이 주문 금액과 일치하지 않습니다');
    }

    payment.status = 'paid';
    payment.paymentKey = paymentKey;
    payment.providerSessionId = paymentKey;
    await payment.save();
    await this.ensureEnrollment(userId, String(payment.course_id));
    appLogger.info('toss_payment_confirmed', {
      paymentId: String(payment._id),
      orderId,
    });
    return payment;
  }

  async mine(userId: string) {
    return this.paymentModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate('course_id', 'title thumbnail')
      .sort({ createdAt: -1 })
      .lean();
  }

  private async requestTossConfirm(paymentKey: string, orderId: string, amount: number) {
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) throw new BadRequestException('TOSS_SECRET_KEY가 설정되지 않았습니다');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      amount?: number;
      message?: string;
    };

    if (!response.ok) {
      appLogger.error('toss_confirm_failed', {
        orderId,
        status: response.status,
        message: data.message,
      });
      throw new BadRequestException(data.message ?? '토스페이먼츠 결제 승인에 실패했습니다');
    }

    return data;
  }

  private async ensureEnrollment(userId: string, courseId: string) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);
    const existing = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });
    if (existing) return existing;

    try {
      return await this.enrollmentModel.create({
        user_id: userOid,
        course_id: courseOid,
      });
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
        return this.enrollmentModel.findOne({ user_id: userOid, course_id: courseOid });
      }
      throw error;
    }
  }

  private toCheckoutResponse(
    payment: PaymentDocument,
    orderName: string,
    user: Pick<User, 'email' | 'name'> | null,
    clientUrl: string,
    courseId: string,
  ) {
    return {
      _id: payment._id,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      orderName,
      customerKey: String(payment.user_id),
      customerEmail: user?.email ?? '',
      customerName: user?.name ?? '',
      clientKey: process.env.TOSS_CLIENT_KEY ?? '',
      checkoutUrl: payment.checkoutUrl,
      successUrl: `${clientUrl}/courses/${courseId}?payment=success`,
      failUrl: `${clientUrl}/courses/${courseId}?payment=fail`,
    };
  }
}
