import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedMutation {
    youthName: string;
    groupName: string;
    reasonType: "MEDICAL" | "INCIDENT" | "DEVELOPMENT" | "OTHER";
    reason: string;
    startDate: string; // ISO date
    endDate?: string; // ISO date
    context?: string;
}

export interface ParsedIndication {
    youthName: string;
    groupName: string;
    type: "PHYSICAL" | "BEHAVIORAL" | "SENSORY" | "MEDICAL" | "OTHER";
    description: string;
    activities?: string[];
    advice?: string;
    validFrom: string; // ISO date
    validUntil?: string; // ISO date
    reasoning?: string;
}

/**
 * Parse mutation text using Gemini AI
 */
export async function parseMutationText(text: string): Promise<ParsedMutation> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Je bent een expert in het analyseren van medische mutatie documenten voor jongeren in een jeugdzorginstelling.

Analyseer de volgende tekst en extraheer de belangrijkste gegevens voor een sportmutatie:

TEKST:
${text}

Geef een JSON response met de volgende structuur:
{
    "youthName": "Voor- en achternaam van de jongere",
    "groupName": "Naam van de leefgroep (bijv. Nes, Orlando, etc.)",
    "reasonType": "MEDICAL | INCIDENT | DEVELOPMENT | OTHER",
    "reason": "Korte beschrijving van de reden (max 100 tekens)",
    "startDate": "YYYY-MM-DD format",
    "endDate": "YYYY-MM-DD format (optioneel, null als onbepaalde tijd)",
    "context": "Extra context of details (optioneel)"
}

BELANGRIJKE REGELS:
- reasonType moet EXACT één van deze waarden zijn: MEDICAL, INCIDENT, DEVELOPMENT, OTHER
- Als het gaat over medische zaken (blessures, behandeling, etc.) → MEDICAL
- Als het gaat over gedragsincidenten of disciplinaire zaken → INCIDENT
- Als het gaat over ontwikkeling of groei → DEVELOPMENT
- Anders → OTHER
- Zorg dat datums in YYYY-MM-DD formaat zijn
- Als geen einddatum bekend is, gebruik null
- Wees zo accuraat mogelijk met namen en groepen

Retourneer ALLEEN de JSON response, geen extra tekst.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up markdown code blocks if present
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResponse);

    // Validate required fields
    if (!parsed.youthName || !parsed.reasonType || !parsed.reason || !parsed.startDate) {
        throw new Error("Missing required fields in parsed mutation data");
    }

    return parsed;
}

/**
 * Parse indication text using Gemini AI
 */
export async function parseIndicationText(text: string): Promise<ParsedIndication> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Je bent een expert in het analyseren van medische indicatie documenten voor geïndiceerde activiteiten in een jeugdzorginstelling.

Analyseer de volgende tekst en extraheer de belangrijkste gegevens voor een sportindicatie:

TEKST:
${text}

Geef een JSON response met de volgende structuur:
{
    "youthName": "Voor- en achternaam van de jongere",
    "groupName": "Naam van de leefgroep (bijv. Nes, Orlando, etc.)",
    "type": "PHYSICAL | BEHAVIORAL | SENSORY | MEDICAL | OTHER",
    "description": "Korte beschrijving van de indicatie (max 150 tekens)",
    "activities": ["Sport (Orlando)", "Muziek (Ben)", "etc."] (optioneel, array van strings),
    "advice": "Advies/suggesties betreft inhoud activiteit (optioneel)",
    "validFrom": "YYYY-MM-DD format",
    "validUntil": "YYYY-MM-DD format (optioneel, null als onbepaalde tijd)",
    "reasoning": "Onderbouwing indicering (optioneel, samenvatting van belangrijkste redenen)"
}

BELANGRIJKE REGELS:
- type moet EXACT één van deze waarden zijn: PHYSICAL, BEHAVIORAL, SENSORY, MEDICAL, OTHER
- Als het gaat over fysieke/motorische zaken → PHYSICAL
- Als het gaat over gedrag, sociale interactie, emoties → BEHAVIORAL
- Als het gaat over sensorische prikkels, concentratie → SENSORY
- Als het gaat over medische zaken, medicatie, behandeling → MEDICAL
- Anders → OTHER
- Zorg dat datums in YYYY-MM-DD formaat zijn
- Als geen einddatum bekend is, gebruik null
- Extraheer alle genoemde activiteiten (bijv. "Sport (Orlando, Sebastiaan, Tim)" wordt ["Sport (Orlando)", "Sport (Sebastiaan)", "Sport (Tim)"])
- Wees zo accuraat mogelijk met namen en groepen

Retourneer ALLEEN de JSON response, geen extra tekst.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up markdown code blocks if present
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResponse);

    // Validate required fields
    if (!parsed.youthName || !parsed.type || !parsed.description || !parsed.validFrom) {
        throw new Error("Missing required fields in parsed indication data");
    }

    return parsed;
}
