import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <Image
        src="/logo.jpg"
        alt="KARA Elektromontage & Service"
        width={240}
        height={80}
        priority
        className="mb-10 h-auto max-h-20 w-auto"
      />
      <LoginForm />
    </div>
  );
}
