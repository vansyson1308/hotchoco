import type { HandlerContext, NormalizedAction, NormalizedEvent } from '../types';

export function handleNormalizedEvent(event: NormalizedEvent, ctx: HandlerContext): NormalizedAction[] {
  if (!ctx.platformCoreV2Enabled) {
    return [{ type: 'sendText', chatId: event.chatId, text: 'Platform core v2 đang tắt.' }];
  }

  const command = event.message.command?.toLowerCase();
  if (!command) {
    return [{ type: 'sendText', chatId: event.chatId, text: 'Đang phát triển…' }];
  }

  if (['/myitems', '/mysales', '/mypayouts'].includes(command)) {
    if (!ctx.isConsignorAuthorized) {
      return [{ type: 'sendText', chatId: event.chatId, text: 'Bạn chưa được cấp quyền consignor portal.' }];
    }

    if (command === '/myitems') {
      return [{ type: 'sendText', chatId: event.chatId, text: '📦 Danh sách hàng ký gửi của bạn đang được tổng hợp.' }];
    }
    if (command === '/mysales') {
      return [{ type: 'sendText', chatId: event.chatId, text: '🧾 Danh sách hàng đã bán của bạn đang được tổng hợp.' }];
    }
    return [{ type: 'sendText', chatId: event.chatId, text: '💰 Tóm tắt payout/settlement của bạn đang được tổng hợp.' }];
  }

  if (!ctx.isStaffAuthorized) {
    return [{ type: 'sendText', chatId: event.chatId, text: 'Bạn chưa được cấp quyền sử dụng bot.' }];
  }

  if (command === '/start') {
    return [{ type: 'sendText', chatId: event.chatId, text: 'Xin chào! HOT CHOCO đã sẵn sàng.' }];
  }

  if (command === '/analytics') {
    return [{ type: 'sendText', chatId: event.chatId, text: 'Đã nhận lệnh /analytics, đang xử lý dữ liệu…' }];
  }

  return [{ type: 'sendText', chatId: event.chatId, text: 'Đang phát triển…' }];
}
