export type CommonResponse = {
  status: boolean;
  error: string;
  reason?: string;
};

export function toastState(
  toast: any,
  t: any,
  state: CommonResponse,
  toastSuccess?: boolean,
) {
  if (state.status)
    toastSuccess &&
      toast({ title: t("success"), description: t("request-success") });
  else toast({ title: t("error"), description: state.error ?? state.reason });
}
