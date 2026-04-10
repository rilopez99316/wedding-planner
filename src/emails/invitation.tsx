import {
  Body, Container, Head, Heading, Html, Link, Preview,
  Section, Text, Button, Hr, Tailwind,
} from "@react-email/components";
import { formatDate } from "@/lib/utils";

interface InvitationEmailProps {
  guestName: string;
  coupleNames: string;
  weddingDate: Date;
  venueName?: string | null;
  rsvpUrl: string;
}

export default function InvitationEmail({
  guestName,
  coupleNames,
  weddingDate,
  venueName,
  rsvpUrl,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to celebrate {coupleNames} — please RSVP</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-12 px-4 max-w-lg">
            {/* Card */}
            <Section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <Section className="bg-gray-900 px-8 py-10 text-center">
                <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  You&apos;re invited
                </Text>
                <Heading className="text-white text-3xl font-light m-0 mb-2">
                  {coupleNames}
                </Heading>
                <Text className="text-gray-400 text-sm m-0">
                  {formatDate(weddingDate)}
                  {venueName && ` · ${venueName}`}
                </Text>
              </Section>

              {/* Body */}
              <Section className="px-8 py-8">
                <Text className="text-gray-600 text-base mb-6">
                  Dear {guestName},
                </Text>
                <Text className="text-gray-600 text-base mb-6 leading-relaxed">
                  We are so pleased to invite you to celebrate our wedding. Your presence means the world to us, and we hope you can join us for this special day.
                </Text>
                <Text className="text-gray-600 text-sm mb-8">
                  Please take a moment to let us know if you&apos;ll be able to attend by clicking the button below.
                </Text>

                {/* CTA */}
                <Section className="text-center mb-8">
                  <Button
                    href={rsvpUrl}
                    className="bg-gray-900 text-white text-sm font-medium py-3 px-8 rounded-lg no-underline inline-block"
                  >
                    RSVP Now
                  </Button>
                </Section>

                <Hr className="border-gray-100 my-6" />

                <Text className="text-gray-400 text-xs text-center">
                  Or copy this link into your browser:
                </Text>
                <Link href={rsvpUrl} className="text-xs text-blue-500 break-all text-center block">
                  {rsvpUrl}
                </Link>
              </Section>
            </Section>

            <Text className="text-center text-xs text-gray-400 mt-6">
              Sent with love via{" "}
              <Link href="https://vows.app" className="text-gray-500">Vows</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
