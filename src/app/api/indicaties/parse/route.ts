import { NextResponse } from "next/server";
import { parseIndicationText } from "@/services/medicalParser";

// Enhanced fallback parser for medical service indication format
function fallbackParser(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Helper to extract field value
    const extractField = (pattern: RegExp, multiline = false): string => {
        if (multiline) {
            const match = text.match(pattern);
            return match ? match[1].trim() : "";
        }
        for (const line of lines) {
            const match = line.match(pattern);
            if (match) return match[1].trim();
        }
        return "";
    };

    // Extract youth name
    const youthName = extractField(/Naam\s+jongere:?\s*([^\n]+)/i) ||
        extractField(/jongere:?\s*([^\n]+)/i) ||
        "Onbekend";

    // Extract leefgroep (living group)
    const leefgroep = extractField(/Leefgroep:?\s*([^\n]+)/i);

    // Extract indication types (Sport, Muziek, Creatief)
    const sportMatch = text.match(/Sport\s*\(([^)]+)\)/i);
    const musicMatch = text.match(/Muziek\s*\(([^)]+)\)/i);
    const creativeMatch = text.match(/Creatief\s*aanbod\s*\(([^)]+)\)/i);

    const indicationTypes = [];
    const responsiblePersons = [];

    if (sportMatch) {
        indicationTypes.push("Sport");
        responsiblePersons.push(...sportMatch[1].split(',').map(s => s.trim()));
    }
    if (musicMatch) {
        indicationTypes.push("Muziek");
        responsiblePersons.push(...musicMatch[1].split(',').map(s => s.trim()));
    }
    if (creativeMatch) {
        indicationTypes.push("Creatief");
        responsiblePersons.push(...creativeMatch[1].split(',').map(s => s.trim()));
    }

    // Extract dates
    const validFromMatch = text.match(/Indicatie\s+afgegeven\s+van[^:]*:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    const validUntilMatch = text.match(/tot:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);

    // Convert DD-MM-YYYY to YYYY-MM-DD
    const convertDate = (dateStr: string): string => {
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    };

    const validFrom = validFromMatch ? convertDate(validFromMatch[1]) : new Date().toISOString().split('T')[0];
    const validUntil = validUntilMatch ? convertDate(validUntilMatch[1]) : undefined;

    // Extract issued by
    const issuedBy = extractField(/Indicatie\s+afgegeven\s+door:?\s*([^\n]+)/i) || "Medische Dienst";

    // Extract feedback to
    const feedbackTo = extractField(/Terugkoppelen\s+voortgang\s+aan:?\s*([^\n]+)/i);

    // Extract if can be combined with group
    const canCombineMatch = text.match(/Kan\s+gecombineerd.*?indicatie\?:?\s*(Ja|Nee|J|N)/i);
    const canCombine = canCombineMatch ? canCombineMatch[1].toUpperCase().startsWith('J') : false;

    // Extract underbouwing/rationale (main description)
    const underbouwingMatch = text.match(/Onderbouwing\s+indicering:?\s*([^]*?)(?=Beleggingstips|Leerdoelen|$)/i);
    const underbouwing = underbouwingMatch ? underbouwingMatch[1].trim().substring(0, 1000) : "";

    // Extract guidance tips
    const tipsMatch = text.match(/Beleggingstips.*?diagostiek:?\s*([^]*?)(?=Leerdoelen|$)/i);
    const guidanceTips = tipsMatch ? tipsMatch[1].trim().substring(0, 1000) : "";

    // Extract learning goals
    const goalsMatch = text.match(/Leerdoelen.*?toepassing\):?\s*([^]*?)$/i);
    const learningGoals = goalsMatch ? goalsMatch[1].trim() : "";

    return {
        youthName,
        leefgroep,
        indicationTypes: indicationTypes.join(', ') || "Sport",
        type: indicationTypes[0] || "SPORT",
        responsiblePersons: responsiblePersons.join(', '),
        validFrom,
        validUntil,
        issuedBy,
        feedbackTo,
        canCombineWithGroup: canCombine,
        description: underbouwing,
        guidanceTips,
        learningGoals: learningGoals === "N.v.t." || learningGoals === "N.V.T." ? "" : learningGoals,
        confidence: 0.8 // Higher confidence for structured format
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
