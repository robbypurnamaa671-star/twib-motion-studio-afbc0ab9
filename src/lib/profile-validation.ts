import { z } from "zod";

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,29}$/;

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(60, "Max 60 characters"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      USERNAME_REGEX,
      "2–30 chars, lowercase letters/numbers/hyphens, must start with a letter or number",
    ),
  bio: z.string().trim().max(280, "Max 280 characters").optional().or(z.literal("")),
  website_url: z.string().trim().url("Invalid URL").max(200).optional().or(z.literal("")),
  instagram_url: z.string().trim().url("Invalid URL").max(200).optional().or(z.literal("")),
  facebook_url: z.string().trim().url("Invalid URL").max(200).optional().or(z.literal("")),
  twitter_url: z.string().trim().url("Invalid URL").max(200).optional().or(z.literal("")),
});

export type ProfileForm = z.infer<typeof profileSchema>;