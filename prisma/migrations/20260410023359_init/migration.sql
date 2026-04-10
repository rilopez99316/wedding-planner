-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "partner1Name" TEXT NOT NULL,
    "partner2Name" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "rsvpDeadline" TIMESTAMP(3) NOT NULL,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#0071E3',
    "coverPhotoUrl" TEXT,
    "totalBudget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingEvent" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeddingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestGroup" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "hasPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneNameIfKnown" TEXT,
    "invitationTier" TEXT NOT NULL DEFAULT 'A',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestGroupEvent" (
    "groupId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "GuestGroupEvent_pkey" PRIMARY KEY ("groupId","eventId")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "invitationToken" TEXT,
    "invitationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpResponse" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plusOneAttending" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,

    CONSTRAINT "RsvpResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventResponse" (
    "id" TEXT NOT NULL,
    "rsvpId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL,

    CONSTRAINT "EventResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryRestriction" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "restriction" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DietaryRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "Wedding"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingEvent_weddingId_key_key" ON "WeddingEvent"("weddingId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_invitationToken_key" ON "Guest"("invitationToken");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpResponse_groupId_key" ON "RsvpResponse"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "EventResponse_rsvpId_eventKey_key" ON "EventResponse"("rsvpId", "eventKey");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingEvent" ADD CONSTRAINT "WeddingEvent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestGroup" ADD CONSTRAINT "GuestGroup_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestGroupEvent" ADD CONSTRAINT "GuestGroupEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestGroupEvent" ADD CONSTRAINT "GuestGroupEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResponse" ADD CONSTRAINT "EventResponse_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "RsvpResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestriction" ADD CONSTRAINT "DietaryRestriction_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
