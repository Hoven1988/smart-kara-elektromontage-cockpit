import Image from "next/image";
import { getCompanyLogoUrl } from "@/lib/settings";
import { LoginForm } from "@/components/login-form";
import { DevFooter } from "@/components/dev-footer";

export default async function LoginPage() {
  const logoUrl = await getCompanyLogoUrl();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="Firmenlogo"
          width={240}
          height={80}
          priority
          className="mb-10 h-auto max-h-20 w-auto"
        />
      ) : (
        <p className="mb-10 text-2xl font-semibold tracking-wide text-copper-light">
          KARA Cockpit
        </p>
      )}
      <LoginForm />
      <div className="mt-10 w-full max-w-sm">
        <DevFooter />
      </div>
    </div>
  );
}
