"use client";

import { useState } from "react";
import { IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { signInWithProvider } from "@/app/auth/actions";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState<"google" | "facebook" | null>(
        null,
    );

    async function handleSignIn(provider: "google" | "facebook") {
        setIsLoading(provider);

        const result = await signInWithProvider(provider);

        if (result.success) {
            window.location.href = result.data.url;
        } else {
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
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSignIn("google")}
                        disabled={isLoading !== null}
                    >
                        {isLoading === "google" ? (
                            <span className="animate-spin">...</span>
                        ) : (
                            <IconBrandGoogle className="h-5 w-5" />
                        )}
                        Continue with Google
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSignIn("facebook")}
                        disabled={isLoading !== null}
                    >
                        {isLoading === "facebook" ? (
                            <span className="animate-spin">...</span>
                        ) : (
                            <IconBrandFacebook className="h-5 w-5" />
                        )}
                        Continue with Facebook
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
