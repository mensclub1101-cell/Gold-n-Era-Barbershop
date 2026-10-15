import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Sign up | Golden Era Barbershop" };

export default function SignupPage() {
  return (
    <ComingSoon
      title="Sign up"
      body="Client sign-up opens soon. Barbers will join with an invite link from the shop owner."
    />
  );
}
