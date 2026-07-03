import { api } from './client';
import type { OrderItemKind, OrderRead, PayResponse } from '@/types/api';

export interface CreateOrderPayload {
  item_kind: OrderItemKind;
  course_id?: string | null;
  program_id?: string | null;
  /** Optional promo code (course orders only). Server re-validates + prices. */
  promocode?: string | null;
}

export const ordersApi = {
  create(payload: CreateOrderPayload) {
    return api.post<OrderRead>('/orders', { json: payload });
  },
  detail(id: string) {
    return api.get<OrderRead>(`/orders/${id}`);
  },
  cancel(id: string) {
    return api.delete<OrderRead>(`/orders/${id}`);
  },
  payCard(id: string, paymentMethodId: string) {
    return api.post<PayResponse>(`/orders/${id}/pay/card`, {
      json: { payment_method_id: paymentMethodId },
    });
  },
  payPayme(id: string, returnUrl?: string) {
    return api.post<PayResponse>(`/orders/${id}/pay/payme`, {
      json: returnUrl ? { return_url: returnUrl } : {},
    });
  },
};
