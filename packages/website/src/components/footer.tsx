import { ThemeMenu } from "./theme-menu";
import { Link } from "@/components/ui/link";

export const Footer = () => (
  <footer className="mt-24 flex items-center justify-between border-t pt-6">
    <p className="text-sm text-muted-foreground">
      Made by <Link href="https://aidenybai.com">Aiden Bai</Link>
    </p>
    <div className="flex items-center gap-3">
      <span className="text-sm">
        <Link href="https://github.com/aidenybai/tla-ts">GitHub</Link>
      </span>
      <ThemeMenu />
    </div>
  </footer>
);
