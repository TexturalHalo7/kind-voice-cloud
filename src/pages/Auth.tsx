import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Sparkles, Check, X, Eye, EyeOff, Wand2 } from "lucide-react";

// Synthetic email domain used so Supabase (which requires an email) can store
// the account. Users never see or type this — auth is purely username + password.
const SYNTHETIC_EMAIL_DOMAIN = "vok.local";
const usernameToEmail = (u: string) =>
  `${u.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@${SYNTHETIC_EMAIL_DOMAIN}`;

const ADJECTIVES = ["Sunny", "Kind", "Brave", "Happy", "Gentle", "Bright", "Cozy", "Merry", "Lucky", "Calm", "Wild", "Swift", "Bold", "Sweet", "Jolly"];
const NOUNS = ["Panda", "Fox", "Star", "Moon", "River", "Cloud", "Otter", "Bear", "Bunny", "Comet", "Robin", "Willow", "Maple", "Petal", "Sparrow"];
const generateUsername = () => {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${a}${n}${num}`;
};

const generatePassword = () => {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  const specials = "!@#$%&*?";
  const all = lower + upper + nums + specials;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [pick(lower), pick(upper), pick(nums), pick(specials)];
  for (let i = 0; i < 8; i++) base.push(pick(all));
  return base.sort(() => Math.random() - 0.5).join("");
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Please enter a username");
      return;
    }
    if (!isLogin && !isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Try username lookup first (existing accounts with real emails),
        // fall back to the synthetic email format for new-style accounts.
        let authEmail: string | null = null;
        const { data: lookedUp } = await supabase.rpc("get_email_by_username", {
          lookup_username: trimmed,
        });
        authEmail = (lookedUp as string | null) || usernameToEmail(trimmed);

        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        if (error) throw new Error("Invalid username or password.");

        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: usernameToEmail(trimmed),
          password,
          options: {
            data: { username: trimmed },
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
          <h1 className="text-4xl font-bold text-foreground drop-shadow-sm">Voices of Kindness</h1>
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
                ? "Sign in with your username to continue spreading kindness"
                : "Pick a username and password — that's it, no email needed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                  {!isLogin && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUsername(generateUsername())}
                      className="rounded-xl shrink-0"
                      title="Generate a username"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!isLogin && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPassword(generatePassword());
                        setShowPassword(true);
                      }}
                      className="rounded-xl shrink-0"
                      title="Generate a password"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {!isLogin && password.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
                    <PasswordRequirement met={hasNumber} text="At least 1 number" />
                    <PasswordRequirement met={hasSpecialChar} text="At least 1 special character" />
                  </div>
                )}
                {!isLogin && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Write down your password — without an email you can't reset it.
                  </p>
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
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account you agree to our{" "}
                  <a href="/terms" className="underline hover:text-primary">Terms and Conditions</a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
