import { NextResponse } from "next/server";
import { parseIndicationText } from "@/services/medicalParser";
import type { ParsedIndicatie } from "@/types/indication";

/**
 * Genereert een korte, leesbare beschrijving voor weergave in de tabel
 * Max 150 karakters, bevat de essentie van de indicatie
 */
function makeKorteBeschrijving(parsed: ParsedIndicatie): string {
    // Prioriteit: onderbouwing > bejegeningstips > advies > leerdoelen
    let bron = parsed.onderbouwingIndicering;

    if (!bron || bron.length < 20) {
        bron = parsed.bejegeningstips;
    }
    if (!bron || bron.length < 20) {
        bron = parsed.adviesInhoudActiviteit;
    }
    if (!bron || bron.length < 20) {
        bron = parsed.leerdoelen;
    }

    if (!bron || bron === "-" || bron === "N.v.t.") {
        // Fallback: genereer beschrijving op basis van activiteit en naam
        const activiteiten = Array.isArray(parsed.indicatieActiviteit)
            ? parsed.indicatieActiviteit.join(", ")
            : parsed.indicatieActiviteit;
        return `${parsed.naamJongere} - ${activiteiten} indicatie${parsed.leefgroep ? ` voor ${parsed.leefgroep}` : ""}`;
    }

    // Clean up de tekst
    let description = bron
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^[•\-\*]\s*/gm, '') // Remove bullets
        .trim();

    // Neem eerste zin of eerste 150 karakters
    const firstSentence = description.match(/^[^.!?]+[.!?]/);
    if (firstSentence && firstSentence[0].length <= 150) {
        return firstSentence[0].trim();
    }

    // Truncate op 150 karakters, bij laatste spatie
    if (description.length > 150) {
        description = description.substring(0, 150);
        const lastSpace = description.lastIndexOf(' ');
        if (lastSpace > 100) {
            description = description.substring(0, lastSpace);
        }
        description += '...';
    }

    return description;
}

/**
 * Parse datum string in verschillende formaten
 * Ondersteunt: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
 */
function parseDatum(dateStr: string): string | null {
    if (!dateStr || dateStr === '-') return null;

    const cleaned = dateStr.trim().toLowerCase();

    // Map Dutch month names to numbers
    const months: { [key: string]: string } = {
        'januari': '01', 'jan': '01',
        'februari': '02', 'feb': '02',
        'maart': '03', 'mrt': '03',
        'april': '04', 'apr': '04',
        'mei': '05',
        'juni': '06', 'jun': '06',
        'juli': '07', 'jul': '07',
        'augustus': '08', 'aug': '08',
        'september': '09', 'sep': '09',
        'oktober': '10', 'okt': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12'
    };

    // Try DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try "22 november 2025" or "22 nov 2025"
    const dutchDate = cleaned.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (dutchDate) {
        const [, day, monthName, year] = dutchDate;
        const month = months[monthName];
        if (month) {
            return `${year}-${month}-${day.padStart(2, '0')}`;
        }
    }

    // Try YYYY-MM-DD (already ISO format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
    }

    return dateStr; // Return original if we can't parse (might be displayed as text)
}

// Enhanced fallback parser for "Aanmelding geïndiceerde activiteiten" format
function fallbackParser(text: string): ParsedIndicatie {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Helper to extract field value
    const extractField = (pattern: RegExp, defaultValue = ""): string => {
        for (const line of lines) {
            const match = line.match(pattern);
            if (match) return match[1].trim();
        }
        return defaultValue;
    };

    // Helper to extract multi-line sections
    const extractSection = (startPattern: RegExp, endPattern?: RegExp): string => {
        const match = text.match(startPattern);
        if (!match) return "";

        let content = match[1];
        if (endPattern) {
            const endMatch = content.match(endPattern);
            if (endMatch) {
                content = content.substring(0, endMatch.index);
            }
        }

        return content
            .trim()
            .substring(0, 3000); // Generous limit for long text
    };

    // 1. Naam jongere
    const naamJongere = extractField(/Naam\s+jongere:?\s*([^\n]+)/i, "Onbekend");

    // 2. Leefgroep
    const leefgroep = extractField(/Leefgroep:?\s*([^\n]+)/i, "");

    // 3. Indicatie activiteit - detect X markers
    const indicatieActiviteit: string[] = [];

    // Check for Sport with X marker
    if (/Sport.*?X/i.test(text)) {
        indicatieActiviteit.push("Sport");
    }
    // Check for Muziek with X marker
    if (/Muziek.*?X/i.test(text)) {
        indicatieActiviteit.push("Muziek");
    }
    // Check for Creatief with X marker
    if (/Creatief.*?X/i.test(text)) {
        indicatieActiviteit.push("Creatief aanbod");
    }

    // 4. Advies/suggestie
    const adviesInhoudActiviteit = extractField(/Advies\/suggestie\s+betreft\s+inhoud\s+activiteit:?\s*([^\n]+)/i, "-");

    // 5. Indicatie van - tot (dates) - IMPROVED
    // Helper to find value, potentially on next line
    const findValueWithNextLine = (pattern: RegExp): string | null => {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(pattern);
            if (match) {
                let value = match[1].trim();
                // If value is empty or just special chars like * or -, try next line
                if ((!value || /^[*:\-–]+$/.test(value)) && i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    // Basic check to ensure next line isn't another field label
                    if (nextLine && !nextLine.includes(":") && nextLine.length < 50) {
                        return nextLine;
                    }
                }
                return value;
            }
        }
        return null;
    };

    // 5. Indicatie van - tot (dates) - IMPROVED
    let geldigVanaf: string | null = null;
    let geldigTot: string | null = null;
    let dateRangeText = "";

    // Strategy 1: Combined line "Indicatie afgegeven van - tot: 01-01-2024 - 01-06-2024"
    // Use findValueWithNextLine to handle cases where the date is on the next line
    const combinedMatch = findValueWithNextLine(/Indicatie\s+afgegeven\s+van\s*[–-]\s*tot:?\s*([^\n]*)/i);

    if (combinedMatch) {
        dateRangeText = combinedMatch;

        // Check if it's a single date first (e.g. 14-11-2025)
        // A date looks like d-m-y or dd-mm-yyyy
        const singleDateMatch = combinedMatch.match(/^\s*\d{1,2}[-]\d{1,2}[-]\d{4}\s*$/);

        if (singleDateMatch) {
            geldigVanaf = parseDatum(combinedMatch);
        } else {
            // Try to split by " - " or " – " (spaces around hyphen) to avoid splitting the date itself
            // If no spaces, we might have issues, but usually ranges have spaces.
            // Let's try splitting by " - " or " – " first.
            let dateParts = combinedMatch.split(/\s+[–-]\s+/);

            // If that didn't work (length 1), and it's NOT a single date (already checked),
            // maybe it's "01-01-2024-01-06-2024" (rare but possible).
            // But safely, if we have "14-11-2025", split(/\s+[–-]\s+/) gives ["14-11-2025"].

            if (dateParts.length === 1) {
                // It might be just one date, try parsing it
                geldigVanaf = parseDatum(dateParts[0]);
            } else {
                if (dateParts.length >= 1) geldigVanaf = parseDatum(dateParts[0]);
                if (dateParts.length >= 2) geldigTot = parseDatum(dateParts[1]);
            }
        }
    } else {
        // Strategy 2: Separate fields with multiline support
        const vanVal = findValueWithNextLine(/Indicatie\s+afgegeven\s+van\s*[*]*:?\s*([^\n]*)/i);
        if (vanVal) {
            geldigVanaf = parseDatum(vanVal);
            dateRangeText = vanVal;
        }

        const totVal = findValueWithNextLine(/^Tot\s*[*]*:?\s*([^\n]*)/i);
        if (totVal) {
            geldigTot = parseDatum(totVal);
            if (dateRangeText) dateRangeText += ` - ${totVal}`;
        }
    }

    // 6. Indicatie afgegeven door
    const indicatieAfgegevenDoor = extractField(/Indicatie\s+afgegeven\s+door:?\s*([^\n]+)/i, "");

    // 7. Terugkoppelen aan
    const terugkoppelingAan = extractField(/Terugkoppelen\s+voortgang\s+aan:?\s*([^\n]+)/i, "");

    // 8. Kan gecombineerd worden?
    const combineText = extractField(/Kan\s+gecombineerd\s+worden.*?indicatie\?:?\s*([^\n]+)/i);
    let kanCombinerenMetGroepsgenoot: boolean | null = null;
    if (combineText) {
        kanCombinerenMetGroepsgenoot = /^(ja|j|yes|y)/i.test(combineText.trim());
    }

    // 9. Onderbouwing indicering
    const onderbouwingIndicering = extractSection(
        /Onderbouwing\s+indicering:?\s*([\s\S]*?)(?=Bejegeningstips|Leerdoelen|$)/i
    );

    // 10. Bejegeningstips
    const bejegeningstips = extractSection(
        /Bejegeningstips\s+in\s+het\s+licht\s+van\s+de\s+diagnostiek:?\s*([\s\S]*?)(?=Leerdoelen|$)/i
    );

    // 11. Leerdoelen
    let leerdoelen = extractSection(/Leerdoelen:?\s*\(?\s*indien\s+van\s+toepassing\s*\)?:?\s*([\s\S]*?)$/i);
    if (/n\.?v\.?t\.?/i.test(leerdoelen)) {
        leerdoelen = "N.v.t.";
    }

    const parsed: ParsedIndicatie = {
        naamJongere,
        leefgroep,
        indicatieActiviteit,
        adviesInhoudActiviteit,
        indicatieVanTot: dateRangeText, // Keep original for backwards compatibility
        geldigVanaf: geldigVanaf || undefined,
        geldigTot: geldigTot || undefined,
        indicatieAfgegevenDoor,
        terugkoppelingAan,
        kanCombinerenMetGroepsgenoot,
        onderbouwingIndicering,
        bejegeningstips,
        leerdoelen
    };

    return parsed;
}

export async function POST(request: Request) {
    try {
        console.log("Received parse request");
        const body = await request.json();
        const { text } = body;

        console.log("Parse request text length:", text?.length);

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        // Check if text is too short
        if (text.trim().length < 10) {
            return NextResponse.json(
                { error: "Tekst is te kort. Plak een volledig indicatie document." },
                { status: 400 }
            );
        }

        // Try AI parsing first if API key is available
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-api-key-here") {
            try {
                const parsed = await parseIndicationText(text);
                return NextResponse.json(parsed);
            } catch (aiError) {
                console.warn("AI parsing failed, using fallback:", aiError);
                // Continue to fallback below
            }
        }

        // Use fallback parser
        console.log("Using fallback parser for indication text");
        const parsed = fallbackParser(text);

        // Generate short description for table
        const korteBeschrijving = makeKorteBeschrijving(parsed);

        return NextResponse.json({
            ...parsed,
            korteBeschrijving,
            confidence: 0.85,
            warning: "Automatische AI-analyse niet beschikbaar. Controleer de ingevulde gegevens."
        });

    } catch (error) {
        console.error("Parse indication error:", error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json(
            {
                error: "Fout bij analyseren van tekst",
                details: errorMessage,
                suggestion: "Probeer de tekst handmatig in te vullen via het 'Handmatig' tabblad."
            },
            { status: 500 }
        );
    }
}
