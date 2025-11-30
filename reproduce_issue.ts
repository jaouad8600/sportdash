
function findValueWithNextLine(regex: RegExp, text: string): string | null {
    const match = text.match(regex);
    if (!match) return null;

    let value = match[1].trim();

    // If the value is empty, check the next line
    if (!value) {
        const lines = text.split('\n');
        const matchIndex = lines.findIndex(line => regex.test(line));
        if (matchIndex !== -1 && lines[matchIndex + 1]) {
            value = lines[matchIndex + 1].trim();
        }
    }
    return value;
}

function parseDatum(dateStr: string): string | null {
    if (!dateStr) return null;

    // Clean up
    const cleanStr = dateStr.trim().toLowerCase().replace(/[.,]/g, '');

    // Handle Dutch month names
    const dutchMonths: { [key: string]: string } = {
        'januari': '01', 'februari': '02', 'maart': '03', 'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'augustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mrt': '03', 'apr': '04', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'okt': '10', 'nov': '11', 'dec': '12'
    };

    // Try dd-mm-yyyy or dd/mm/yyyy
    const numericMatch = cleanStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (numericMatch) {
        const day = numericMatch[1].padStart(2, '0');
        const month = numericMatch[2].padStart(2, '0');
        const year = numericMatch[3];
        return `${year}-${month}-${day}`;
    }

    return null;
}

const text = `
Aanmelding geïndiceerde activiteiten
Naam jongere: Pablo de Jeger
Leefgroep: Nes
Indicatie voor*
* zet een X achter welke
activiteit van toepassing is
Sport (Orlando,
Sebastiaan, Tim)
X
Muziek (Ben)
Creatief aanbod (Laura)
Advies/suggestie betreft
inhoud activiteit:
-
Indicatie afgegeven van - tot: 14-11-2025
Indicatie afgegeven door: 16-12-2025
Terugkoppelen voortgang aan: GW
Kan gecombineerd worden
met groepsgenoot met
indicatie?
Ja
`;

console.log("Testing text:");
console.log(text);

let geldigVanaf: string | null = null;
let geldigTot: string | null = null;
let dateRangeText = "";

// Strategy 1: Combined line "Indicatie afgegeven van - tot: 01-01-2024 - 01-06-2024"
const combinedMatch = findValueWithNextLine(/Indicatie\s+afgegeven\s+van\s*[–-]\s*tot:?\s*([^\\n]*)/i, text);

console.log("Combined Match Value:", combinedMatch);

if (combinedMatch) {
    dateRangeText = combinedMatch;
    const dateParts = combinedMatch.split(/[–-]/); // Split by en-dash or hyphen
    console.log("Date Parts:", dateParts);

    if (dateParts.length >= 1) {
        geldigVanaf = parseDatum(dateParts[0]);
        console.log("Parsed Vanaf:", geldigVanaf);
    }
    if (dateParts.length >= 2) {
        geldigTot = parseDatum(dateParts[1]);
        console.log("Parsed Tot:", geldigTot);
    }
}
