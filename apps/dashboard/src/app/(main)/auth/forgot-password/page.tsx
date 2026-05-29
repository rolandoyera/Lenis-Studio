import { ForgotPasswordForm } from "../_components/forgot-password-form";

export default function ForgotPassword() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Recover Password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email below to receive a secure recovery link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </>
  );
}
