import { createClient } from “convex/react”;
export const convex = createClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
