"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithProvider, signInWithEmail } from "@/app/auth/actions";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<
        "google" | "facebook" | "email" | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    async function handleOAuthSignIn(provider: "google" | "facebook") {
        setIsLoading(provider);
        setError(null);

        const result = await signInWithProvider(provider);

        if (result.success) {
            window.location.href = result.data.url;
        } else {
            setError(result.error.message);
            setIsLoading(null);
        }
    }

    async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading("email");
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const result = await signInWithEmail({ email, password });

        if (result.success) {
            router.push("/dashboard");
        } else {
            setError(result.error.message);
            setIsLoading(null);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Welcome to PulseFlow
                    </CardTitle>
                    <CardDescription>
                        Sign in to start monitoring your web signals
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                disabled={isLoading !== null}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                disabled={isLoading !== null}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading !== null}
                        >
                            {isLoading === "email" ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthSignIn("google")}
                            disabled={isLoading !== null}
                        >
                            {isLoading === "google" ? (
                                <span className="animate-spin">...</span>
                            ) : (
                                <IconBrandGoogle className="h-5 w-5" />
                            )}
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthSignIn("facebook")}
                            disabled={isLoading !== null}
                        >
                            {isLoading === "facebook" ? (
                                <span className="animate-spin">...</span>
                            ) : (
                                <IconBrandFacebook className="h-5 w-5" />
                            )}
                            Facebook
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
