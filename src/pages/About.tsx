import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Sparkles, MessageCircle, Users, Globe, Shield } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-white/20 p-5 rounded-full shadow-glow backdrop-blur-sm">
            <Heart className="w-14 h-14 text-white" fill="currentColor" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          About Voices of Kindness
        </h1>
        
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          A platform built on the belief that a kind word can change someone's day
        </p>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Our Mission */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Voices of Kindness exists to create a space where human connection thrives through the power of voice. 
              In a world that can sometimes feel overwhelming, we believe that hearing another person's voice—full 
              of warmth, encouragement, and genuine care—can make all the difference. Our mission is to spread 
              positivity, one voice message at a time.
            </p>
          </div>

          {/* Why We Created This */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/20 w-12 h-12 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Why We Created This</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Sometimes all it takes is hearing another human voice to feel a little less alone. We created 
              Voices of Kindness because we noticed how disconnected people can feel in today's digital world. 
              Text messages and social media posts, while convenient, often lack the warmth and emotion that 
              comes from actually hearing someone speak.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We wanted to build something different—a place where people could share genuine, heartfelt 
              messages of encouragement, hope, and kindness. Whether you're having a tough day and need to 
              hear something uplifting, or you want to send positivity out into the world, this platform 
              is for you.
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold">How It Works</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span><strong>Record a message:</strong> Share words of encouragement, motivation, or simply a warm greeting. Your voice could be exactly what someone needs to hear.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><strong>Listen and connect:</strong> Hear messages from people around the world. If a message resonates with you, send a thank you or start a conversation.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span><strong>Build connections:</strong> Chat with others who share your desire to spread kindness. Every interaction has the power to brighten someone's day.</span>
              </li>
            </ul>
          </div>

          {/* Our Values */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Values</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">🤝 Kindness First</h3>
                <p className="text-sm text-muted-foreground">Every message shared here is meant to uplift and encourage. We foster a community built on compassion.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">🌍 Global Community</h3>
                <p className="text-sm text-muted-foreground">Kindness knows no borders. We connect people from all around the world through the universal language of care.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">🔒 Safe Space</h3>
                <p className="text-sm text-muted-foreground">We're committed to maintaining a safe, positive environment where everyone feels welcome and respected.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">✨ Real Impact</h3>
                <p className="text-sm text-muted-foreground">We believe small acts of kindness create ripples of positivity that can change lives.</p>
              </div>
            </div>
          </div>

          {/* Join Us */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Join the Movement</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By sending a message, you could be helping someone through a difficult moment. By listening, 
              you might find the encouragement you didn't know you needed. Every voice here has the power 
              to make a difference. Together, we can create a world where kindness is just a click away.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                size="lg"
                className="bg-gradient-warm hover:opacity-90 shadow-soft rounded-full px-8"
              >
                Get Started Today
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/70 text-sm">
        <p>Made with ❤️ to spread positivity around the world</p>
      </footer>
    </div>
  );
};

export default About;
