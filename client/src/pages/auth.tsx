import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();

    const signInForm = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const currentForm = isLogin ? signInForm : signUpForm;

    // Reset form when toggling between login/signup
    useEffect(() => {
        signInForm.reset();
        signUpForm.reset();
    }, [isLogin]);

    async function onSignIn(data: SignInFormValues) {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (error) throw error;
            toast.success("Welcome back!");
            setLocation("/app");
        } catch (error: any) {
            toast.error(error.message || "Sign in failed");
        } finally {
            setIsLoading(false);
        }
    }

    async function onSignUp(data: SignUpFormValues) {
        setIsLoading(true);
        try {
            const { data: signUpData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });
            if (error) throw error;
            
            // Check if email confirmation is required
            if (signUpData?.user && !signUpData.session) {
                toast.success("Account created! Please check your email to verify your account.", {
                    duration: 10000,
                    description: "We sent a confirmation link to " + data.email
                });
                signUpForm.reset();
            } else if (signUpData?.session) {
                // Auto-login enabled (no email confirmation required)
                toast.success("Account created successfully!");
                setLocation("/app");
            } else {
                toast.success("Account created! Please check your email to verify.");
                signUpForm.reset();
            }
        } catch (error: any) {
            toast.error(error.message || "Sign up failed");
        } finally {
            setIsLoading(false);
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
                        <CardDescription>
                            {isLogin
                                ? "Enter your credentials to access your workspace"
                                : "Enter your details to create a new workspace"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLogin ? (
                            <Form {...signInForm}>
                                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                                    <FormField
                                        control={signInForm.control}
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
                                        control={signInForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        autoComplete="current-password"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sign In
                                    </Button>
                                </form>
                            </Form>
                        ) : (
                            <Form {...signUpForm}>
                                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                                    <FormField
                                        control={signUpForm.control}
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
                                        control={signUpForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        autoComplete="new-password"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={signUpForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        autoComplete="new-password"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sign Up
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            variant="link"
                            className="w-full"
                            onClick={toggleMode}
                        >
                            {isLogin
                                ? "Don't have an account? Sign Up"
                                : "Already have an account? Sign In"}
                        </Button>
                        {isLogin && (
                            <Button
                                variant="link"
                                className="w-full text-sm text-muted-foreground"
                                onClick={async () => {
                                    const email = signInForm.getValues("email");
                                    if (!email) {
                                        toast.error("Please enter your email address");
                                        return;
                                    }
                                    try {
                                        await supabase.auth.resetPasswordForEmail(email, {
                                            redirectTo: `${window.location.origin}/auth`,
                                        });
                                        toast.success("Password reset email sent! Check your inbox.");
                                    } catch (error: any) {
                                        toast.error(error.message || "Failed to send reset email");
                                    }
                                }}
                            >
                                Forgot password?
                            </Button>
                        )}
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
