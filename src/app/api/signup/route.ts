import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const signupSchema = z.object({
  email:           z.string().email(),
  password:        z.string().min(8),
  confirmPassword: z.string(),
  partner1Name:    z.string().min(1),
  partner2Name:    z.string().min(1),
  weddingDate:     z.string(),
  rsvpDeadline:    z.string(),
  venueName:       z.string().optional(),
  venueAddress:    z.string().optional(),
  slug:            z.string().min(3).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Check email not already taken
    const existingUser = await db.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Check slug not taken
    const existingWedding = await db.wedding.findUnique({ where: { slug: data.slug } });
    if (existingWedding) {
      return NextResponse.json({ error: "That URL is already taken." }, { status: 409 });
    }

    const passwordHash = await hash(data.password, 12);

    // Create user + wedding in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email:        data.email,
          name:         `${data.partner1Name} & ${data.partner2Name}`,
          passwordHash,
        },
      });

      await tx.wedding.create({
        data: {
          slug:        data.slug,
          ownerId:     newUser.id,
          partner1Name: data.partner1Name,
          partner2Name: data.partner2Name,
          weddingDate:  new Date(data.weddingDate),
          rsvpDeadline: new Date(data.rsvpDeadline),
          venueName:   data.venueName || null,
          venueAddress: data.venueAddress || null,
          // Seed default events
          events: {
            create: [
              { key: "ceremony",       label: "Ceremony",        date: new Date(data.weddingDate), order: 0 },
              { key: "reception",      label: "Reception",       date: new Date(data.weddingDate), order: 1 },
            ],
          },
        },
      });

      return newUser;
    });

    // Sign in the user via credentials
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
