import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError || !authData.user) {
      toast.error("Login Failed", { description: authError?.message || "Invalid credentials" });
      setLoading(false);
      return;
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      toast.error("Login Failed", { description: "Could not find a user profile for this account." });
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    
    toast.success("Login Successful!");
    navigate("/");

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-healing p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">Welcome Back</CardTitle>
          <CardDescription>Sign in to access the Srijoni Healing Home system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary h-12">
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}