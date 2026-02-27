interface InsertErrorLike {
  code?: string;
  message?: string;
}

export interface AttendanceInsertResolution {
  ok: boolean;
  userMessageVi: string;
  shouldLog: boolean;
  errorCode?: 'DUPLICATE_ATTENDANCE' | 'DB_ERROR';
}

export function resolveAttendanceInsertResult(error?: InsertErrorLike | null): AttendanceInsertResolution {
  if (!error) {
    return {
      ok: true,
      userMessageVi: 'Chấm công thành công. Chúc bạn một ngày làm việc hiệu quả!',
      shouldLog: false
    };
  }

  if (error.code === '23505') {
    return {
      ok: false,
      userMessageVi: 'Đã chấm công hôm nay rồi!',
      shouldLog: false,
      errorCode: 'DUPLICATE_ATTENDANCE'
    };
  }

  return {
    ok: false,
    userMessageVi: 'Có lỗi khi lưu chấm công. Bạn vui lòng thử lại sau.',
    shouldLog: true,
    errorCode: 'DB_ERROR'
  };
}
