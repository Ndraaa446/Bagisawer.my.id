export const MAX_SUPPORT_AMOUNT = 100_000_000;
export const MIN_SUPPORT_AMOUNT = 1_000;
export const SUPPORT_AMOUNT_STEP = 1_000;
export const SUPPORTER_NAME_MAX_LENGTH = 80;
export const SUPPORT_MESSAGE_MAX_LENGTH = 240;

export function validateSupportAmount(value, minimum = MIN_SUPPORT_AMOUNT) {
  return Number.isFinite(value)
    && Number.isSafeInteger(value)
    && Number.isSafeInteger(minimum)
    && minimum >= MIN_SUPPORT_AMOUNT
    && value >= minimum
    && value <= MAX_SUPPORT_AMOUNT
    && value % SUPPORT_AMOUNT_STEP === 0;
}

export function validateSupportText(name, message) {
  return typeof name === "string"
    && typeof message === "string"
    && name.trim().length <= SUPPORTER_NAME_MAX_LENGTH
    && message.trim().length <= SUPPORT_MESSAGE_MAX_LENGTH;
}
