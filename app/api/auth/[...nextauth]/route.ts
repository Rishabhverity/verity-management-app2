import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth requires dynamic rendering because it uses cookies
export const dynamic = "force-dynamic";

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [
    { nextauth: ['signin'] },
    { nextauth: ['signout'] },
    { nextauth: ['callback'] },
    { nextauth: ['session'] },
    { nextauth: ['csrf'] },
    { nextauth: ['providers'] },
    { nextauth: ['error'] },
    { nextauth: ['verify-request'] },
  ];
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };