import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Log in | Golden Era Barbershop" };

export default function LoginPage() {
  return (
    <ComingSoon
      title="Log in"
      body="Accounts for clients, barbers and the owner are on the way. Each one gets its own experience after you log in."
    />
  );
}
