export interface SettlementSummaryInput {
  consignorName: string;
  itemCount: number;
  grossPayoutVnd: number;
  shopCommissionVnd: number;
  deductionsVnd: number;
  netPayoutVnd: number;
  carryOverVnd: number;
}

function fmtVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

export function formatSettlementSummary(input: SettlementSummaryInput): string {
  const lines = [
    `📒 Quyết toán nhà ký gửi: ${input.consignorName}`,
    `Số món: ${input.itemCount}`,
    `Tổng trả trước khấu trừ: ${fmtVnd(input.grossPayoutVnd)}`,
    `Hoa hồng shop giữ lại: ${fmtVnd(input.shopCommissionVnd)}`,
    `Khấu trừ (refund): ${fmtVnd(input.deductionsVnd)}`,
    `Thực nhận kỳ này: ${fmtVnd(input.netPayoutVnd)}`
  ];

  if (input.carryOverVnd > 0) {
    lines.push(`⚠️ Khấu trừ chuyển kỳ sau: ${fmtVnd(input.carryOverVnd)}`);
  }

  return lines.join('\n');
}
