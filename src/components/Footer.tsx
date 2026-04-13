import { Youtube, Facebook, Mail, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Mufti Masud</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Secular blogger, writer, and ex-Muslim scholar. Exploring truth, philosophy, and humanism.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-primary transition-colors">About Mufti Masud</a></li>
              <li><a href="/updates" className="hover:text-primary transition-colors">Latest Updates</a></li>
              <li><a href="/books" className="hover:text-primary transition-colors">Books & Publications</a></li>
              <li><a href="/contact" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Follow Me</h3>
            <div className="flex space-x-4">
              <a href="https://www.youtube.com/@Mufti-Masud" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/murtad.masud" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:contact@muftimasud.com" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Mufti Masud. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
