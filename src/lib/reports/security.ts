export function sanitizeCsvField(value: string | null | undefined): string {
    if (!value) return '';
    const str = String(value);
    if (/^[=+\-@]/.test(str)) {
        return "'" + str; // Prefix with a single quote to neutralize formula evaluation in Excel
    }
    return str;
}
