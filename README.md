# Lama Dev School Management Dashboard

## Getting Started

First, run the development server:

```bash
set -e
cd /workspaces/sportdash || exit 1
mkdir -p public src/components

# Placeholder SVG (wordt gebruikt als je echte PNG nog niet geüpload is)
cat > public/teylingereind-logo.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 80">
  <rect width="420" height="80" fill="white"/>
  <g transform="translate(10,10)">
    <polygon points="0,20 70,50 50,55 10,65" fill="#f24e05"/>
    <polygon points="60,10 130,45 105,45 75,50 40,35" fill="#f24e05"/>
    <text x="150" y="42" font-family="Inter, Arial" font-weight="700" font-size="28" fill="#161a44">Teylingereind</text>
    <text x="152" y="60" font-family="Inter, Arial" font-size="14" fill="#161a44">Forensisch Centrum Jeugd</text>
  </g>
</svg>
SVG

cat > src/components/Brand.tsx <<'TSX'
"use client";
import Image from "next/image";
import Link from "next/link";
export default function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50">
      <Image
        src={typeof window !== "undefined" && !!document.createElement("img") ? "/teylingereind-logo.png" : "/teylingereind-logo.svg"}
        alt="Teylingereind • Sport & Activiteiten"
        width={144}
        height={36}
        priority
        className="h-9 w-auto"
      />
      <div className="sr-only">Dashboard</div>
    </Link>
  );
}
TSX

echo "Brand component en placeholder geplaatst. Upload je echte logo als: public/teylingereind-logo.png"# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Lama Dev Youtube Channel](https://youtube.com/lamadev)
- [Next.js](https://nextjs.org/learn)

## Backupsysteem (SportDash)

SportDash beschikt over een ingebouwd backupsysteem dat volledige projectarchieven maakt (code + database + config).

### Opslag
Backups worden opgeslagen in de map `backups/` in de root van het project. Deze map wordt genegeerd door Git om te voorkomen dat backups in de versiebeheergeschiedenis terechtkomen.

### Inhoud van een backup
Een backup is een `.tgz` archief en bevat:
- Broncode (`src/`, `app/`, `components/`, etc.)
- Configuratiebestanden (`package.json`, `prisma/schema.prisma`, etc.)
- Database (`prisma/dev.db`)
- Migraties en seeds

Mappen zoals `node_modules`, `.next`, en `.git` worden **niet** opgenomen om de bestandsgrootte beperkt te houden.

### Gebruik

#### Via Dashboard
Ga naar **Instellingen > Back-up** (of `/back-up`).
- **Lijst bekijken:** Zie alle beschikbare backups met datum en grootte.
- **Nieuwe backup:** Klik op "Nieuwe Backup" om direct een backup te maken.
- **Downloaden:** Klik op het download-icoon naast een backup om het `.tgz` bestand te downloaden.

#### Via Terminal
Je kunt ook handmatig een backup maken via de terminal:

```bash
npm run backup
```

#### Automatiseren (Cron)
Om backups automatisch te laten draaien (bijvoorbeeld elke nacht om 03:00), kun je een cronjob instellen op de server:

```bash
0 3 * * * cd /pad/naar/sportdash && npm run backup >> /pad/naar/sportdash/backups/cron.log 2>&1
```
