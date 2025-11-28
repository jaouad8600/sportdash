/*
  Warnings:

  - You are about to drop the column `needsRestorativeTalk` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `needsRestorativeTalk` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `needsRestorativeTalk` on the `Youth` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Material" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Material" ADD COLUMN "subLocation" TEXT;

-- CreateTable
CREATE TABLE "RestorativeTalk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "youthName" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "completedAt" DATETIME,
    "archivedAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RestorativeTalk_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "coverUrl" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "youthId" TEXT,
    "youthName" TEXT NOT NULL,
    "loanedBy" TEXT NOT NULL,
    "loanDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "returnDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    CONSTRAINT "Loan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT 'GROEN',
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "youthCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Group" ("color", "createdAt", "department", "id", "isActive", "name", "status", "updatedAt", "youthCount") SELECT "color", "createdAt", "department", "id", "isActive", "name", "status", "updatedAt", "youthCount" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Note_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("archived", "authorId", "content", "createdAt", "groupId", "id", "updatedAt") SELECT "archived", "authorId", "content", "createdAt", "groupId", "id", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SESSION',
    "presentYouth" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT,
    "sessionSummary" TEXT,
    "interventions" TEXT,
    "incidents" TEXT,
    "injuries" TEXT,
    "planForTomorrow" TEXT,
    "youthCount" INTEGER NOT NULL DEFAULT 0,
    "leaderCount" INTEGER NOT NULL DEFAULT 0,
    "warmingUp" TEXT,
    "activity" TEXT,
    "rawText" TEXT,
    "cleanedText" TEXT,
    "parsedData" TEXT,
    "parsedAt" DATETIME,
    "parsedBy" TEXT,
    "confidenceScore" REAL,
    "author" TEXT,
    "authorId" TEXT,
    "isIncident" BOOLEAN NOT NULL DEFAULT false,
    "indicationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Report_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_indicationId_fkey" FOREIGN KEY ("indicationId") REFERENCES "SportIndication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("archived", "author", "authorId", "cleanedText", "confidenceScore", "createdAt", "date", "groupId", "id", "incidents", "indicationId", "injuries", "interventions", "isIncident", "mood", "parsedAt", "parsedBy", "planForTomorrow", "presentYouth", "rawText", "sessionSummary", "type", "updatedAt") SELECT "archived", "author", "authorId", "cleanedText", "confidenceScore", "createdAt", "date", "groupId", "id", "incidents", "indicationId", "injuries", "interventions", "isIncident", "mood", "parsedAt", "parsedBy", "planForTomorrow", "presentYouth", "rawText", "sessionSummary", "type", "updatedAt" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_SportIndication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youthId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "leefgroep" TEXT,
    "responsiblePersons" TEXT,
    "feedbackTo" TEXT,
    "canCombineWithGroup" BOOLEAN NOT NULL DEFAULT true,
    "guidanceTips" TEXT,
    "learningGoals" TEXT,
    "validFrom" DATETIME NOT NULL,
    "validUntil" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" DATETIME,
    "pauseReason" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "evaluations" JSONB DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SportIndication_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "Youth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SportIndication_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SportIndication" ("createdAt", "description", "groupId", "id", "isActive", "issuedBy", "type", "updatedAt", "validFrom", "validUntil", "youthId") SELECT "createdAt", "description", "groupId", "id", "isActive", "issuedBy", "type", "updatedAt", "validFrom", "validUntil", "youthId" FROM "SportIndication";
DROP TABLE "SportIndication";
ALTER TABLE "new_SportIndication" RENAME TO "SportIndication";
CREATE TABLE "new_Youth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Youth_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Youth" ("createdAt", "firstName", "groupId", "id", "lastName", "updatedAt") SELECT "createdAt", "firstName", "groupId", "id", "lastName", "updatedAt" FROM "Youth";
DROP TABLE "Youth";
ALTER TABLE "new_Youth" RENAME TO "Youth";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
