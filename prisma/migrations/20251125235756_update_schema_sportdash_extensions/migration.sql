-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "debriefing" TEXT;
ALTER TABLE "Incident" ADD COLUMN "deescalation" TEXT;
ALTER TABLE "Incident" ADD COLUMN "restorativeAction" TEXT;
ALTER TABLE "Incident" ADD COLUMN "returnProcess" TEXT;
ALTER TABLE "Incident" ADD COLUMN "staffShare" TEXT;
ALTER TABLE "Incident" ADD COLUMN "teamLeaderContact" TEXT;

-- CreateTable
CREATE TABLE "Restriction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youthId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Restriction_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "Youth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Restriction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
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
    "groupId" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    CONSTRAINT "Loan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("bookId", "dueDate", "id", "loanDate", "loanedBy", "notes", "returnDate", "status", "youthId", "youthName") SELECT "bookId", "dueDate", "id", "loanDate", "loanedBy", "notes", "returnDate", "status", "youthId", "youthName" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "quantityTotal" INTEGER NOT NULL DEFAULT 0,
    "quantityUsable" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "subLocation" TEXT,
    "imageUrl" TEXT,
    "conditionStatus" TEXT NOT NULL DEFAULT 'GOED',
    "quantityBroken" INTEGER NOT NULL DEFAULT 0,
    "quantityToOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Material" ("category", "conditionStatus", "createdAt", "description", "id", "imageUrl", "location", "name", "quantityTotal", "quantityUsable", "subLocation", "updatedAt") SELECT "category", "conditionStatus", "createdAt", "description", "id", "imageUrl", "location", "name", "quantityTotal", "quantityUsable", "subLocation", "updatedAt" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "groupId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "description", "endTime", "id", "resourceId", "resourceName", "startTime", "title", "updatedAt", "userId", "userName") SELECT "createdAt", "description", "endTime", "id", "resourceId", "resourceName", "startTime", "title", "updatedAt", "userId", "userName" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE TABLE "new_SportIndication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youthId" TEXT,
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
    CONSTRAINT "SportIndication_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "Youth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SportIndication_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SportIndication" ("archived", "archivedAt", "canCombineWithGroup", "createdAt", "description", "evaluations", "feedbackTo", "groupId", "guidanceTips", "id", "isActive", "isPaused", "issuedBy", "learningGoals", "leefgroep", "pauseReason", "pausedAt", "responsiblePersons", "type", "updatedAt", "validFrom", "validUntil", "youthId") SELECT "archived", "archivedAt", "canCombineWithGroup", "createdAt", "description", "evaluations", "feedbackTo", "groupId", "guidanceTips", "id", "isActive", "isPaused", "issuedBy", "learningGoals", "leefgroep", "pauseReason", "pausedAt", "responsiblePersons", "type", "updatedAt", "validFrom", "validUntil", "youthId" FROM "SportIndication";
DROP TABLE "SportIndication";
ALTER TABLE "new_SportIndication" RENAME TO "SportIndication";
CREATE TABLE "new_SportMutation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youthId" TEXT,
    "groupId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SportMutation_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "Youth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SportMutation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SportMutation" ("createdAt", "createdBy", "endDate", "groupId", "id", "isActive", "reason", "reasonType", "startDate", "updatedAt", "youthId") SELECT "createdAt", "createdBy", "endDate", "groupId", "id", "isActive", "reason", "reasonType", "startDate", "updatedAt", "youthId" FROM "SportMutation";
DROP TABLE "SportMutation";
ALTER TABLE "new_SportMutation" RENAME TO "SportMutation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
