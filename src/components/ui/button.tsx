"use client";
import { ComponentProps } from "react";
import clsx from "clsx";

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};
export default function Button({
  className,
  variant = "primary",
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        "btn",
        {
          "btn-primary": variant === "primary",
          "btn-secondary": variant === "secondary",
          "btn-ghost": variant === "ghost",
          "btn-danger": variant === "danger",
        },
        className,
      )}
      {...rest}
    />
  );
}
