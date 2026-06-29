export const ToastType = {
  SUCCESS: "success",
  ERROR: "error",
  PENDING: "pending",
} as const;

export type ToastType = (typeof ToastType)[keyof typeof ToastType];

export type ToastPayload = {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};
