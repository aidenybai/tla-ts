import { useSyncExternalStore, type ComponentProps } from "react";

// Stand-ins for next/navigation's usePathname and next/link, over the History API.
const NAVIGATE_EVENT = "navigate";

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
};

export const usePathname = (): string => useSyncExternalStore(subscribe, () => location.pathname);

const navigate = (href: string): void => {
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
};

interface LinkProps extends ComponentProps<"a"> {
  href: string;
}

export const Link = ({ href, onClick, ...props }: LinkProps) => (
  <a
    href={href}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      navigate(href);
    }}
    {...props}
  />
);
