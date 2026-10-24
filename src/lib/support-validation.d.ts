export const MAX_SUPPORT_AMOUNT: 100000000;
export const MIN_SUPPORT_AMOUNT: 1000;
export const SUPPORT_AMOUNT_STEP: 1000;
export const SUPPORTER_NAME_MAX_LENGTH: 80;
export const SUPPORT_MESSAGE_MAX_LENGTH: 240;
export function validateSupportAmount(value: number, minimum?: number): boolean;
export function validateSupportText(name: string, message: string): boolean;
