import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/features/account/ProfileForm";
import { PasswordForm } from "@/components/features/account/PasswordForm";
import { getUserProfile } from "@/actions/account";

export default async function AccountPage() {
  const result = await getUserProfile();

  if (!result.success) {
    redirect("/login");
  }

  const profile = result.data;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and security settings
        </p>
      </div>

      <ProfileForm
        email={profile.email}
        firstName={profile.firstName}
        lastName={profile.lastName}
      />

      <Separator />

      <PasswordForm />
    </div>
  );
}
