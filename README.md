# Sportmoment Dashboard

Deze applicatie is een basis voor het registreren van sportmomenten, rapportages en incidenten binnen een instelling.

## Installatie

1. Installeer dependencies en genereer de database:

```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

2. Start de ontwikkelserver:

```bash
npm run dev
```

De applicatie is beschikbaar op [http://localhost:3000](http://localhost:3000).

## Accounts

Met het seed-script worden voorbeeldgebruikers aangemaakt:

- admin@example.com / admin
- gl@example.com / gl
- docent@example.com / docent

## Features

- Inloggen via NextAuth (credentials).
- Aanmaken en ophalen van sessies via `/api/sessions`.
- Incidenten registreren via `/api/incidents`.
