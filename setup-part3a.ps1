# ============================================================
# GAME PARLOUR — PART 3A — PRISMA SETUP
# Creates:
#   prisma/schema.prisma
#   prisma/seed.ts
#
# Safe to run multiple times.
# Writes UTF-8 WITHOUT BOM.
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " GAME PARLOUR - PRISMA SETUP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# ENSURE PRISMA DIRECTORY
# ============================================================

New-Item -ItemType Directory -Force -Path ".\prisma" | Out-Null

# ============================================================
# prisma/schema.prisma
# ============================================================

$schema = @'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserRole {
  OWNER
}

enum BookingStatus {
  DRAFT
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  COMPLETED
  PAYMENT_FAILED
  REFUND_PENDING
  REFUNDED
  PARTIALLY_REFUNDED
  EXPIRED
}

enum PaymentMethod {
  COUNTER
  ONLINE
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUND_PENDING
  REFUNDED
  PARTIALLY_REFUNDED
  CANCELLED
}

enum RefundStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum StationStatus {
  AVAILABLE
  DISABLED
  MAINTENANCE
}

enum AvailabilityBlockType {
  STATION
  PARLOUR
}

enum ConsentType {
  BOOKING_NOTIFICATION
  MARKETING
}

enum NotificationType {
  BOOKING_CONFIRMATION
  BOOKING_UPDATE
  CANCELLATION
  REFUND
  MANUAL_WHATSAPP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  CANCEL
  REFUND
  BACKUP
  RESTORE
  EXPORT
  ANONYMIZE
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  role         UserRole  @default(OWNER)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  auditLogs AuditLog[]

  @@index([email])
}

model Customer {
  id            String   @id @default(cuid())
  name          String
  phone         String   @unique
  email         String?
  isAnonymized  Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bookings      Booking[]
  consents      Consent[]
  notifications Notification[]

  @@index([name])
  @@index([phone])
}

model Game {
  id           String    @id @default(cuid())
  name         String
  slug         String    @unique
  description  String?
  imageUrl     String?
  platform     String
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  bookings     Booking[]
  pricingRules PricingRule[]

  @@index([isActive])
  @@index([platform])
}

model Station {
  id                 String        @id @default(cuid())
  name               String        @unique
  consoleType        String
  status             StationStatus @default(AVAILABLE)
  isActive            Boolean       @default(true)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  bookings            Booking[]
  pricingRules        PricingRule[]
  availabilityBlocks  AvailabilityBlock[]

  @@index([status])
  @@index([isActive])
}

model PricingRule {
  id          String    @id @default(cuid())
  name        String
  gameId      String?
  stationId   String?
  durationMin Int
  price       Decimal   @db.Decimal(10, 2)
  isPeak      Boolean   @default(false)
  startsAt    DateTime?
  endsAt      DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  game        Game?     @relation(fields: [gameId], references: [id], onDelete: SetNull)
  station     Station?  @relation(fields: [stationId], references: [id], onDelete: SetNull)

  @@index([gameId])
  @@index([stationId])
  @@index([durationMin])
  @@index([isActive])
}

model AvailabilityBlock {
  id        String                @id @default(cuid())
  type      AvailabilityBlockType
  stationId String?
  startsAt  DateTime
  endsAt    DateTime
  reason    String?
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt

  station   Station?              @relation(fields: [stationId], references: [id], onDelete: Cascade)

  @@index([stationId, startsAt, endsAt])
  @@index([type, startsAt, endsAt])
}

model Booking {
  id                    String        @id @default(cuid())
  bookingCode           String        @unique
  customerId            String
  gameId                String
  stationId             String
  startsAt              DateTime
  endsAt                DateTime
  durationMin           Int
  status                BookingStatus @default(DRAFT)
  subtotal              Decimal       @db.Decimal(10, 2)
  discount              Decimal       @default(0) @db.Decimal(10, 2)
  total                 Decimal       @db.Decimal(10, 2)
  currency              String        @default("INR")
  paymentMethod         PaymentMethod @default(COUNTER)
  paymentStatus         PaymentStatus @default(PENDING)
  priceSnapshot         Json
  qrToken               String?       @unique
  customerNameSnapshot  String
  customerPhoneSnapshot String
  customerEmailSnapshot String?
  cancellationReason    String?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  confirmedAt           DateTime?
  cancelledAt            DateTime?
  completedAt            DateTime?

  customer      Customer       @relation(fields: [customerId], references: [id], onDelete: Restrict)
  game          Game           @relation(fields: [gameId], references: [id], onDelete: Restrict)
  station       Station       @relation(fields: [stationId], references: [id], onDelete: Restrict)
  payments      Payment[]
  refunds       Refund[]
  notifications Notification[]

  @@index([customerId])
  @@index([gameId])
  @@index([stationId, startsAt, endsAt])
  @@index([status])
  @@index([startsAt])
  @@index([bookingCode])
}

model Payment {
  id                String        @id @default(cuid())
  bookingId         String
  method            PaymentMethod
  status            PaymentStatus  @default(PENDING)
  provider          String?
  providerReference String?
  amount            Decimal       @db.Decimal(10, 2)
  currency          String         @default("INR")
  metadata          Json?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  paidAt            DateTime?

  booking Booking  @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  refunds Refund[]

  @@index([bookingId])
  @@index([status])
  @@index([providerReference])
}

model Refund {
  id                String       @id @default(cuid())
  bookingId         String
  paymentId         String?
  status            RefundStatus @default(PENDING)
  amount            Decimal      @db.Decimal(10, 2)
  currency          String       @default("INR")
  reason            String?
  providerReference String?
  metadata          Json?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  completedAt       DateTime?

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  payment Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)

  @@index([bookingId])
  @@index([paymentId])
  @@index([status])
}

model Offer {
  id            String   @id @default(cuid())
  name          String
  code          String?  @unique
  description   String?
  discountType  String
  discountValue Decimal  @db.Decimal(10, 2)
  minAmount     Decimal? @db.Decimal(10, 2)
  maxDiscount   Decimal? @db.Decimal(10, 2)
  startsAt      DateTime
  endsAt        DateTime
  usageLimit    Int?
  usageCount    Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([isActive])
  @@index([startsAt, endsAt])
}

model Notification {
  id              String             @id @default(cuid())
  customerId      String?
  bookingId       String?
  type            NotificationType
  status          NotificationStatus @default(PENDING)
  channel         String             @default("WHATSAPP")
  recipientMasked String?
  messagePreview  String?
  sentAt          DateTime?
  failedAt        DateTime?
  errorCode       String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  customer Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  booking  Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)

  @@index([customerId])
  @@index([bookingId])
  @@index([status])
  @@index([createdAt])
}

model Consent {
  id         String      @id @default(cuid())
  customerId String
  type       ConsentType
  granted    Boolean     @default(false)
  grantedAt  DateTime?
  revokedAt  DateTime?
  source     String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([customerId, type])
  @@index([customerId])
  @@index([type, granted])
}

model AuditLog {
  id         String    @id @default(cuid())
  userId     String?
  action     AuditAction
  entityType String
  entityId   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
'@

# ============================================================
# WRITE SCHEMA — UTF-8 WITHOUT BOM
# ============================================================

$schemaPath = Join-Path $PWD "prisma\schema.prisma"

[System.IO.File]::WriteAllText(
    $schemaPath,
    $schema,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Created: prisma\schema.prisma" -ForegroundColor Green

# ============================================================
# prisma/seed.ts
# ============================================================

$seed = @'
import { PrismaClient, StationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding Game Parlour database...");

  const games = [
    {
      name: "EA Sports FC 25",
      slug: "ea-sports-fc-25",
      platform: "PlayStation 5",
      description: "Football gaming experience.",
    },
    {
      name: "Grand Theft Auto V",
      slug: "grand-theft-auto-v",
      platform: "PlayStation 5",
      description: "Open-world action experience.",
    },
    {
      name: "Tekken 8",
      slug: "tekken-8",
      platform: "PlayStation 5",
      description: "Competitive fighting game.",
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: {
        slug: game.slug,
      },
      update: {
        name: game.name,
        platform: game.platform,
        description: game.description,
        isActive: true,
      },
      create: game,
    });
  }

  const stations = [
    {
      name: "PS5 Station 01",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 02",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 03",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 04",
      consoleType: "PlayStation 5",
    },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: {
        name: station.name,
      },
      update: {
        consoleType: station.consoleType,
        status: StationStatus.AVAILABLE,
        isActive: true,
      },
      create: station,
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
'@

# ============================================================
# WRITE SEED — UTF-8 WITHOUT BOM
# ============================================================

$seedPath = Join-Path $PWD "prisma\seed.ts"

[System.IO.File]::WriteAllText(
    $seedPath,
    $seed,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Created: prisma\seed.ts" -ForegroundColor Green

# ============================================================
# VALIDATION
# ============================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " VALIDATING PRISMA FILES" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $schemaPath)) {
    throw "ERROR: prisma\schema.prisma was not created."
}

if (-not (Test-Path $seedPath)) {
    throw "ERROR: prisma\seed.ts was not created."
}

$schemaBytes = [System.IO.File]::ReadAllBytes($schemaPath)

if ($schemaBytes.Length -ge 3 -and
    $schemaBytes[0] -eq 0xEF -and
    $schemaBytes[1] -eq 0xBB -and
    $schemaBytes[2] -eq 0xBF) {

    throw "ERROR: schema.prisma still contains UTF-8 BOM."
}

$seedBytes = [System.IO.File]::ReadAllBytes($seedPath)

if ($seedBytes.Length -ge 3 -and
    $seedBytes[0] -eq 0xEF -and
    $seedBytes[1] -eq 0xBB -and
    $seedBytes[2] -eq 0xBF) {

    throw "ERROR: seed.ts still contains UTF-8 BOM."
}

Write-Host "BOM check: PASS" -ForegroundColor Green
Write-Host "Schema exists: PASS" -ForegroundColor Green
Write-Host "Seed exists: PASS" -ForegroundColor Green

Write-Host ""
Write-Host "Files:" -ForegroundColor Yellow

Get-ChildItem ".\prisma" -File |
    Select-Object Name, Length, LastWriteTime |
    Format-Table -AutoSize

# ============================================================
# OPTIONAL PRISMA FORMAT CHECK
# ============================================================

Write-Host ""
Write-Host "Running Prisma format..." -ForegroundColor Cyan

if (Test-Path ".\node_modules\.bin\prisma.cmd") {

    & ".\node_modules\.bin\prisma.cmd" format --schema ".\prisma\schema.prisma"

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "WARNING: Prisma format failed." -ForegroundColor Yellow
        Write-Host "Install dependencies first with: npm install" -ForegroundColor Yellow
    }
    else {
        Write-Host "Prisma format: PASS" -ForegroundColor Green
    }

}
else {

    Write-Host "Prisma CLI not installed yet." -ForegroundColor Yellow
    Write-Host "Run: npm install" -ForegroundColor White
}

# ============================================================
# COMPLETE
# ============================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " PART 3A COMPLETE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Created:" -ForegroundColor Yellow
Write-Host "  prisma\schema.prisma" -ForegroundColor White
Write-Host "  prisma\seed.ts" -ForegroundColor White

Write-Host ""
Write-Host "Next commands:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npx prisma generate" -ForegroundColor White
Write-Host "  npx prisma validate" -ForegroundColor White
Write-Host "  npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "  npm run prisma:seed" -ForegroundColor White
Write-Host ""