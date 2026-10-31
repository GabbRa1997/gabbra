"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useTransitionNav, type TransitionVariant } from "./TransitionProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  variant?: TransitionVariant;
};

/** A normal link (works with middle-click, right-click, crawlers) that plays the discipline transition on plain clicks. */
export default function TLink({ href, variant, onClick, ...rest }: Props) {
  const { go } = useTransitionNav();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        )
          return;
        e.preventDefault();
        go(href, variant);
      }}
    />
  );
}
