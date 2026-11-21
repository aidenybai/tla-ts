import { m, type Transition } from "motion/react";

const BACK_SHEET_PATH = "M168 168 L216 168 L216 40 L88 40 L88 88";
const FRONT_SHEET_PATH = "M40 88 L168 88 L168 216 L40 216 L40 88";
const CHECK_PATH = "M40 144 L68 172 L96 200 L160 136 L224 72";
const TRANSITION: Transition = { type: "spring", duration: 0.3, bounce: 0 };

interface CopyIconProps {
  isCopied: boolean;
}

export const CopyIcon = (props: CopyIconProps) => (
  <svg
    aria-hidden
    viewBox="0 0 256 256"
    fill="none"
    stroke="currentColor"
    strokeWidth={16}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <m.path
      d={BACK_SHEET_PATH}
      initial={false}
      animate={props.isCopied ? { x: -48, y: 48, opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
      transition={TRANSITION}
    />
    <m.path
      initial={false}
      animate={{ d: props.isCopied ? CHECK_PATH : FRONT_SHEET_PATH }}
      transition={TRANSITION}
    />
  </svg>
);
