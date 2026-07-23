import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, Copy } from "lucide-react";

const forgotSchema = z.object({
    email: z.string().email("Invalid email address"),
});
type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [resetUrl, setResetUrl] = useState<string | null>(null);
    const [, setLocation] = useLocation();

    const form = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
        defaultValues: { email: "" },
    });

    async function onSubmit(data: ForgotFormValues) {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Request failed");

            if (result.resetUrl) {
                setResetUrl(result.resetUrl);
                toast.success("Reset link generated");
            } else {
                // User not found — still show success message (no enumeration)
                toast.success("If an account exists for that email, a reset link has been generated.");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Request failed");
        } finally {
            setIsLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (resetUrl) {
            navigator.clipboard.writeText(resetUrl);
            toast.success("Link copied to clipboard");
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Reset your password</CardTitle>
                        <CardDescription>Enter your email and we'll generate a password reset link.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resetUrl ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Reset link ready</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Click the link below to reset your password. The link expires in 15 minutes.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        onClick={() => setLocation(resetUrl.replace(window.location.origin, ""))}
                                    >
                                        Reset Password
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToClipboard}
                                        aria-label="Copy reset link"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="name@example.com"
                                                        autoComplete="email"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Generate Reset Link
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="link"
                            className="w-full"
                            onClick={() => setLocation("/auth")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-zinc-900 text-white p-12">
                <div className="max-w-md space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Idea Foundry</h1>
                    <p className="text-lg text-zinc-400">
                        Transform raw ideas into actionable product requirements using AI.
                        Identify synergies, analyze markets, and build better products.
                    </p>
                </div>
            </div>
        </div>
    );
}
