"use client";

import { useActionState, useRef } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { changePassword } from "@/actions/account";

interface FormState {
  error: string | null;
  success: boolean;
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const currentPassword = formData.get("currentPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required", success: false };
      }

      if (newPassword.length < 6) {
        return { error: "New password must be at least 6 characters", success: false };
      }

      if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match", success: false };
      }

      if (currentPassword === newPassword) {
        return { error: "New password must be different from current password", success: false };
      }

      const result = await changePassword({ currentPassword, newPassword });

      if (!result.success) {
        return { error: result.error.message, success: false };
      }

      formRef.current?.reset();
      return { error: null, success: true };
    },
    { error: null, success: false }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              Password updated successfully
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={6}
              required
            />
          </div>

          <div className="flex flex-col xs:flex-row xs:justify-end pt-2">
            <Button type="submit" disabled={isPending} className="w-full xs:w-auto">
              {isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
