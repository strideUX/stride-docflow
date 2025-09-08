// Example auth helper stub – integrate your provider and session logic here.
export function requireUser(ctx: { auth: () => { userId?: string | null } }) {
  const { userId } = ctx.auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

