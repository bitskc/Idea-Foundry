import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { register, login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const authSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
type AuthFormValues = z.infer<typeof authSchema>;
type AuthMode = "login" | "signup";

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        form.reset();
    };

    async function onSubmit(data: AuthFormValues) {
        setIsLoading(true);
        try {
            if (mode === "login") {
                await login(data.email, data.password);
                toast.success("Welcome back!");
                setLocation("/app");
            } else if (mode === "signup") {
                await register(data.email, data.password);
                toast.success("Account created successfully!");
                setLocation("/app");
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    }

    const getTitle = () => {
        switch (mode) {
            case "login": return "Welcome back";
            case "signup": return "Create an account";
        }
    };

    const getDescription = () => {
        switch (mode) {
            case "login": return "Enter your credentials to access your workspace";
            case "signup": return "Enter your email to create a new workspace";
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{getTitle()}</CardTitle>
                        <CardDescription>{getDescription()}</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••" 
                                                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {mode === "login" ? "Sign In" : "Sign Up"}
                                    </Button>
                                </form>
                            </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            variant="link"
                            className="w-full"
                            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                        >
                            {mode === "login"
                                ? "Don't have an account? Sign Up"
                                : "Already have an account? Sign In"}
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
