import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";

const resetSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const params = useParams<{ token?: string }>();
    const query = new URLSearchParams(window.location.search);
    const token = params.token || query.get("token") || "";
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [, setLocation] = useLocation();

    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(data: ResetFormValues) {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Reset failed");

            setSuccess(true);
            toast.success("Password reset successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Reset failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Set a new password</CardTitle>
                        <CardDescription>Enter your new password below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Password updated</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Your password has been reset. You can now sign in with your new password.
                                </p>
                                <Button className="w-full" onClick={() => setLocation("/auth")}>
                                    Sign In
                                </Button>
                            </div>
                        ) : !token ? (
                            <div className="space-y-4 text-center">
                                <p className="text-muted-foreground">
                                    This reset link is incomplete. Please request a new password reset link.
                                </p>
                                <Button onClick={() => setLocation("/forgot-password")}>
                                    Request Reset Link
                                </Button>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••"
                                                            autoComplete="new-password"
                                                            className="pr-10"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                            tabIndex={-1}
                                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••"
                                                            autoComplete="new-password"
                                                            className="pr-10"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                            tabIndex={-1}
                                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Reset Password
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                    {!success && (
                        <CardFooter>
                            <Button
                                variant="link"
                                className="w-full"
                                onClick={() => setLocation("/auth")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
                            </Button>
                        </CardFooter>
                    )}
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
