import api from './client';
import type { ApiResponse } from '../types';

export interface TossCheckout {
  _id: string;
  provider: 'toss' | 'sandbox';
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  orderId: string | null;
  orderName: string;
  customerKey: string;
  customerEmail: string;
  customerName: string;
  clientKey: string;
  checkoutUrl: string | null;
  successUrl: string;
  failUrl: string;
}

interface TossPaymentClient {
  requestPayment: (options: Record<string, unknown>) => Promise<void>;
}

interface TossPaymentsRoot {
  requestPayment?: (options: Record<string, unknown>) => Promise<void>;
  payment?: (options: { customerKey: string }) => Promise<TossPaymentClient> | TossPaymentClient;
}

interface TossPaymentsSdk {
  loadTossPayments?: (clientKey: string) => Promise<TossPaymentsRoot>;
  TossPayments?: (clientKey: string) => Promise<TossPaymentsRoot> | TossPaymentsRoot;
  default?: {
    loadTossPayments?: (clientKey: string) => Promise<TossPaymentsRoot>;
    TossPayments?: (clientKey: string) => Promise<TossPaymentsRoot> | TossPaymentsRoot;
  };
}

const importTossSdk = (specifier: string) =>
  new Function('specifier', 'return import(specifier)')(specifier) as Promise<TossPaymentsSdk>;

async function loadTossPayments(clientKey: string) {
  const sdk = await importTossSdk('@tosspayments/tosspayments-sdk');
  const loadTossPaymentsFromSdk = sdk.loadTossPayments ?? sdk.default?.loadTossPayments;
  const createTossPayments = sdk.TossPayments ?? sdk.default?.TossPayments;
  return loadTossPaymentsFromSdk
    ? loadTossPaymentsFromSdk(clientKey)
    : createTossPayments?.(clientKey);
}

export async function requestTossPayment(checkout: TossCheckout) {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || checkout.clientKey;
  if (!clientKey || !checkout.orderId) {
    throw new Error('토스페이먼츠 클라이언트 키 또는 주문번호가 없습니다');
  }

  const tossPayments = await loadTossPayments(clientKey);
  const paymentClient = tossPayments?.requestPayment
    ? tossPayments
    : await tossPayments?.payment?.({ customerKey: checkout.customerKey });

  if (!paymentClient?.requestPayment) {
    throw new Error('토스페이먼츠 SDK를 불러오지 못했습니다');
  }

  await paymentClient.requestPayment({
    method: 'CARD',
    amount: {
      currency: checkout.currency,
      value: checkout.amount,
    },
    orderId: checkout.orderId,
    orderName: checkout.orderName,
    successUrl: checkout.successUrl,
    failUrl: checkout.failUrl,
    customerEmail: checkout.customerEmail,
    customerName: checkout.customerName,
  });
}

export const paymentsApi = {
  checkout: (courseId: string) =>
    api.post<ApiResponse<TossCheckout>>(`/payments/courses/${courseId}/checkout`),
  confirm: (data: { paymentKey: string; orderId: string; amount: number }) =>
    api.post<ApiResponse<unknown>>('/payments/confirm', data),
  mine: () => api.get<ApiResponse<unknown[]>>('/payments/me'),
};
