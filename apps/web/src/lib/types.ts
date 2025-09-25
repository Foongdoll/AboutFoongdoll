export type SectionPayload = {
  header: string;
  content: string;
  footer: string;
  metadata?: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
