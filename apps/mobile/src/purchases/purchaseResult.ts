import type { PurchaseOutcome } from '@rn-health/core';
import { PURCHASES_ERROR_CODE, type PurchasesError } from 'react-native-purchases';

const PURCHASE_ERROR_MESSAGES: Partial<Record<PURCHASES_ERROR_CODE, string>> = {
  [PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR]:
    '구매가 취소되었어요.',
  [PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR]:
    '스토어 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.',
  [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]:
    '이 기기에서는 구매할 수 없어요. 스토어 계정·결제 설정을 확인해 주세요.',
  [PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR]:
    '유효하지 않은 구매 요청이에요. 앱을 다시 실행한 뒤 시도해 주세요.',
  [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]:
    '지금은 이 상품을 구매할 수 없어요. 샌드박스·테스트 계정 설정을 확인해 주세요.',
  [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]:
    '이미 구매한 상품이에요. 구매 복원을 시도해 주세요.',
  [PURCHASES_ERROR_CODE.NETWORK_ERROR]:
    '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  [PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR]:
    '결제 승인 대기 중이에요. 승인 후 앱을 다시 열어 주세요.',
  [PURCHASES_ERROR_CODE.CONFIGURATION_ERROR]:
    '결제 설정이 올바르지 않아요. RevenueCat·스토어 상품 연결을 확인해 주세요.',
  [PURCHASES_ERROR_CODE.TEST_STORE_SIMULATED_PURCHASE_ERROR]:
    '테스트 구매가 실패했어요. RevenueCat Test Store·샌드박스 계정을 확인해 주세요.',
  [PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR]:
    '이미 다른 구매가 진행 중이에요. 잠시 후 다시 시도해 주세요.',
};

function normalizeErrorCode(code: unknown): PURCHASES_ERROR_CODE | null {
  if (code === null || code === undefined) {
    return null;
  }

  const normalized = String(code) as PURCHASES_ERROR_CODE;
  if (Object.values(PURCHASES_ERROR_CODE).includes(normalized)) {
    return normalized;
  }

  return null;
}

function isPurchasesError(error: unknown): error is PurchasesError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return 'code' in error && 'message' in error;
}

function resolvePurchaseErrorMessage(error: PurchasesError): string {
  const errorCode = normalizeErrorCode(error.code);
  if (errorCode && PURCHASE_ERROR_MESSAGES[errorCode]) {
    return PURCHASE_ERROR_MESSAGES[errorCode]!;
  }

  if (error.underlyingErrorMessage) {
    return error.underlyingErrorMessage;
  }

  if (error.message) {
    return error.message;
  }

  return '구매를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

export function toPurchaseOutcome(error: unknown): PurchaseOutcome {
  if (isPurchasesError(error)) {
    const errorCode = normalizeErrorCode(error.code);
    const isCancelled =
      error.userCancelled === true ||
      errorCode === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;

    if (isCancelled) {
      return {
        status: 'cancelled',
        message: PURCHASE_ERROR_MESSAGES[PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR]!,
      };
    }

    return {
      status: 'failed',
      message: resolvePurchaseErrorMessage(error),
    };
  }

  if (error instanceof Error && error.message.length > 0) {
    return {
      status: 'failed',
      message: error.message,
    };
  }

  return {
    status: 'failed',
    message: '구매를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
  };
}

export async function runPurchase(
  action: () => Promise<unknown>,
): Promise<PurchaseOutcome> {
  try {
    await action();
    return { status: 'success' };
  } catch (error) {
    return toPurchaseOutcome(error);
  }
}

let sdkConfigured = false;

export function markPurchasesConfigured(configured: boolean) {
  sdkConfigured = configured;
}

export function isPurchasesConfigured(): boolean {
  return sdkConfigured;
}
