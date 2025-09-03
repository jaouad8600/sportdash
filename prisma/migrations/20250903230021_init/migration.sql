-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "docentId" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "warmup" TEXT,
    "activity" TEXT,
    "cooldown" TEXT,
    "atmosphere" TEXT,
    "interventions" TEXT,
    "notes" TEXT,
    "planTomorrow" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_docentId_fkey" FOREIGN KEY ("docentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "youthFullName" TEXT NOT NULL,
    "time" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "heard" BOOLEAN NOT NULL,
    "measure" TEXT NOT NULL,
    "location" TEXT,
    "followUp" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Incident_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyBundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "htmlPath" TEXT,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyBundle_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_UserGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_UserGroups_AB_unique" ON "_UserGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_UserGroups_B_index" ON "_UserGroups"("B");
