import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Tailwind,
} from "@react-email/components";
import { formatDate } from "@/lib/utils";

interface RsvpConfirmationEmailProps {
  guestName: string;
  coupleNames: string;
  weddingDate: Date;
  attending: boolean;
}

export default function RsvpConfirmationEmail({
  guestName,
  coupleNames,
  weddingDate,
  attending,
}: RsvpConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your RSVP for {coupleNames} is confirmed</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-12 px-4 max-w-lg">
            <Section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Section className="bg-gray-900 px-8 py-8 text-center">
                <Text className="text-2xl mb-2">
                  {attending ? "🎉" : "💌"}
                </Text>
                <Heading className="text-white text-2xl font-light m-0">
                  RSVP Confirmed
                </Heading>
              </Section>

              <Section className="px-8 py-8">
                <Text className="text-gray-600 text-base mb-4">Dear {guestName},</Text>
                <Text className="text-gray-600 text-base mb-6 leading-relaxed">
                  {attending
                    ? `We've received your RSVP and we're so excited to celebrate with you on ${formatDate(weddingDate)}!`
                    : `We've received your RSVP. We're sorry you won't be able to join us, but we appreciate you letting us know. You'll be in our hearts on our special day.`}
                </Text>

                <Hr className="border-gray-100 my-6" />

                <Text className="text-gray-500 text-sm font-medium">Wedding details</Text>
                <Text className="text-gray-600 text-sm mt-1">{coupleNames}</Text>
                <Text className="text-gray-600 text-sm">{formatDate(weddingDate)}</Text>

                <Hr className="border-gray-100 my-6" />
                <Text className="text-gray-400 text-xs">
                  With love, {coupleNames}
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
