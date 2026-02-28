import { auth } from "@/auth";
import AppLayout from "@/components/layout/app-layout";
import { Providers } from "@/components/providers/providers";
import "@/styles/globals.css";

export const metadata = {
  title: "URS - Investment Management",
  description: "Unit Registry System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="dark-mode">
      <body>
        <Providers>
          {session ? <AppLayout>{children}</AppLayout> : children}
        </Providers>
      </body>
    </html>
  );
}
