import { cn } from "cn";

const LINE_COUNT = 8;

interface SpinnerProps {
  className?: string;
}

export const Spinner = (props: SpinnerProps) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    className={cn("size-4", props.className)}
  >
    {Array.from({ length: LINE_COUNT }, (_line, index) => (
      <line
        key={index}
        x1={12}
        y1={3}
        x2={12}
        y2={7}
        transform={`rotate(${(index * 360) / LINE_COUNT} 12 12)`}
        style={{ animationDelay: `${index / LINE_COUNT - 1}s` }}
        className="animate-line-fade"
      />
    ))}
  </svg>
);
