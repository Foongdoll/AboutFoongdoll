export type SectionPayload = {
  header: string;
  content: string;
  footer: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
