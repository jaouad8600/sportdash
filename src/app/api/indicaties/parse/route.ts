import { NextResponse } from "next/server";
import { parseIndicationText } from "@/services/medicalParser";
import type { ParsedIndicatie } from "@/types/indication";

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
            .replace(/^\s*-\s*/gm, '• ') // Convert dashes to bullets
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

    // 5. Indicatie van - tot (dates)
    const indicatieVanTot = extractField(/Indicatie\s+afgegeven\s+van\s*[–-]\s*tot:?\s*([^\n]+)/i, "");

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

    return {
        naamJongere,
        leefgroep,
        indicatieActiviteit,
        adviesInhoudActiviteit,
        indicatieVanTot,
        indicatieAfgegevenDoor,
        terugkoppelingAan,
        kanCombinerenMetGroepsgenoot,
        onderbouwingIndicering,
        bejegeningstips,
        leerdoelen
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text } = body;

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

        return NextResponse.json({
            ...parsed,
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
