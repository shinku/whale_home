export const getAdminSessionCookieName = () =>
  process.env.ADMIN_SESSION_COOKIE || "admin_login_token";

export const adminCookieIsSecure = () =>
  process.env.NODE_ENV === "production" &&
  process.env.ADMIN_COOKIE_SECURE !== "false";
