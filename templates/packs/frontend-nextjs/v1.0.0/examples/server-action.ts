"use server";
import { z } from "zod";

const Input = z.object({ title: z.string().min(1) });

export async function addItem(input: unknown) {
  const { title } = Input.parse(input);
  // persist via your data layer
  return { ok: true, title };
}

