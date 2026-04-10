import {
  Body, Container, Head, Heading, Html, Link, Preview,
  Section, Text, Button, Hr, Tailwind,
} from "@react-email/components";
import { formatDate } from "@/lib/utils";

interface ReminderEmailProps {
  guestName: string;
  coupleNames: string;
  rsvpDeadline: Date;
  rsvpUrl: string;
}

export default function ReminderEmail({
  guestName,
  coupleNames,
  rsvpDeadline,
  rsvpUrl,
}: ReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Friendly reminder: please RSVP for {coupleNames}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-12 px-4 max-w-lg">
            <Section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Section className="bg-amber-50 border-b border-amber-100 px-8 py-6 text-center">
                <Text className="text-xl mb-1">⏰</Text>
                <Heading className="text-gray-900 text-xl font-semibold m-0">
                  RSVP Reminder
                </Heading>
                <Text className="text-gray-500 text-sm m-0 mt-1">
                  Deadline: {formatDate(rsvpDeadline)}
                </Text>
              </Section>

              <Section className="px-8 py-8">
                <Text className="text-gray-600 text-base mb-4">Hi {guestName},</Text>
                <Text className="text-gray-600 text-base mb-6 leading-relaxed">
                  We just wanted to send a gentle reminder that we&apos;d love to hear from you! The RSVP deadline for {coupleNames}&apos;s wedding is coming up on {formatDate(rsvpDeadline)}.
                </Text>

                <Section className="text-center mb-8">
                  <Button
                    href={rsvpUrl}
                    className="bg-gray-900 text-white text-sm font-medium py-3 px-8 rounded-lg no-underline inline-block"
                  >
                    RSVP Now
                  </Button>
                </Section>

                <Hr className="border-gray-100 my-6" />
                <Link href={rsvpUrl} className="text-xs text-blue-500 break-all text-center block">
                  {rsvpUrl}
                </Link>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
