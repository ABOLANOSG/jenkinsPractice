import path from 'path';

export const aboutValveUrl = "https://www.valvesoftware.com/en/about";
export const basePageUrl = "https://store.steampowered.com/";
export const downloadsPath  = path.join(process.cwd(), 'downloads');
export const testData = [
    {a: 2, b:8, expected: 10},
    {a: 45, b:50, expected:95},
    {a:-4, b:5, expected: 1}
];
export const uploadedMssg = "Thank you for your message. It has been sent.";