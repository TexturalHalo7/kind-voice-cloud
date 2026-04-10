import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, Sparkles, Check, X, HelpCircle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  // Reset password validation
  const resetHasMinLength = newPassword.length >= 8;
  const resetHasNumber = /\d/.test(newPassword);
  const resetHasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(newPassword);
  const isResetPasswordValid = resetHasMinLength && resetHasNumber && resetHasSpecialChar;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }
    
    setLoading(true);

    try {
      const email = `${username.toLowerCase().trim()}@voicesofkindness.app`;
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        toast.success("Account created! Welcome to Voices of Kindness 🎉");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResetPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }
    setResetLoading(true);
    try {
      const email = `${resetUsername.toLowerCase().trim()}@voicesofkindness.app`;
      // First sign in to verify the account exists, then update password
      // Since we can't reset without email, we'll use admin-level or inform user
      // For now, send a reset email to the synthetic address
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("If that username exists, a password reset has been initiated. Please try creating a new account if you can't recover yours.");
      setForgotOpen(false);
      setResetUsername("");
      setNewPassword("");
    } catch (error: any) {
      toast.error("Unable to reset password. You may need to create a new account.");
    } finally {
      setResetLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}>
      {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full shadow-glow">
              <Heart className="w-12 h-12 text-primary animate-pulse" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground drop-shadow-sm">
            Voices of Kindness
          </h1>
          <p className="text-foreground/80 text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Send a smile. Hear a smile.
            <Sparkles className="w-5 h-5 text-primary" />
          </p>
        </div>

        <Card className="shadow-glow backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome Back" : "Join the Movement"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Sign in to continue spreading kindness"
                : "Create an account to start sharing positivity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl"
                />
                {!isLogin && password.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
                    <PasswordRequirement met={hasNumber} text="At least 1 number" />
                    <PasswordRequirement met={hasSpecialChar} text="At least 1 special character" />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-warm hover:opacity-90 transition-all shadow-soft rounded-xl h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>

              <div className="flex flex-col items-center gap-2 pt-2">
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Forgot your password?
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Forgot Your Password?
            </DialogTitle>
            <DialogDescription>
              Since Voices of Kindness uses usernames instead of email, password recovery is limited. 
              If you can't remember your password, we recommend creating a new account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Next time, write your password down somewhere safe so you don't forget it!
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setForgotOpen(false);
                  setIsLogin(false);
                }}
                className="w-full bg-gradient-warm hover:opacity-90 rounded-xl"
              >
                Create a New Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setForgotOpen(false)}
                className="w-full rounded-xl"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
