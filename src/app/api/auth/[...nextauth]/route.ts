import { handlers } from "@/lib/auth";

// Force dynamic — auth requires runtime DB connection
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
