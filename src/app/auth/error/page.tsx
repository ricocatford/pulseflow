import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <IconAlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-semibold">Authentication Failed</h1>
        <p className="mt-2 text-gray-600">
          We couldn&apos;t sign you in. Please try again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
