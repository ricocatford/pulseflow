"use client";

import { useActionState } from "react";
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
import { updateProfile } from "@/actions/account";

interface ProfileFormProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface FormState {
  error: string | null;
  success: boolean;
}

export function ProfileForm({ email, firstName, lastName }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const first = formData.get("firstName") as string;
      const last = formData.get("lastName") as string;

      const result = await updateProfile({
        firstName: first,
        lastName: last,
      });

      if (!result.success) {
        return { error: result.error.message, success: false };
      }

      return { error: null, success: true };
    },
    { error: null, success: false }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              Profile updated successfully
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                defaultValue={firstName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                defaultValue={lastName ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Email is managed by your authentication provider
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
