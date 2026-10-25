export const IS_DEV =
  import.meta.env.VITE_DEV_MODE === "true" ||
  (import.meta.env.VITE_DEV_MODE !== "false" && Boolean(import.meta.env.DEV));
