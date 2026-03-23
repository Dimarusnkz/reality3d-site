import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatZodError(error: z.ZodError) {
  const issues = error.issues.map((i) => {
    const path = i.path.join(".");
    return `${path ? `${path}: ` : ""}${i.message}`;
  });
  return `Некорректные данные: ${issues.join("; ")}`;
}
