const fs = require('fs');
let content = fs.readFileSync('lib/messaging.js', 'utf8');

const ratingMessages = {
    hi: 'rating: () => `Aapka consultation complete ho gaya hai. Kripya apni screen par diye gaye button ko daba kar apna anubhav batayein.`,',
    ta: 'rating: () => `Ungal consultation mudinthathu. Thayavu seithu thiraiyil ulla button-ai azhuthi ungal anubhavathai mathippida seiyavum.`,',
    te: 'rating: () => `Mee consultation purthi ayyindi. Dayachesi screen pai unna button nokki mee anubhavanni teliyajeyandi.`,',
    mr: 'rating: () => `Aaple consultation purna jhale aahe. Krupaya screen varil button dabun aple mat nondva.`,',
    bn: 'rating: () => `Apnar consultation sesh hoyeche. Onugroho kore screen e thaka button ti chipe apnar motamot janan.`,',
    gu: 'rating: () => `Aapnu consultation puru thayun che. Krupa karine screen par aapel button dabavine aapno anubhav janavo.`,',
    kn: 'rating: () => `Nimma consultation mugidide. Dayavittu screen nalli iruva button otti nimma anubhavavannu thilisi.`,',
    ml: 'rating: () => `Ningalude consultation kazhinju. Thayavayi screenile button amathi ningalude abhiprayam ariyikkuka.`,',
    pa: 'rating: () => `Aapda consultation poora ho gaya hai. Kripa karke screen te ditte button nu daba ke apna anubhav dasso.`,',
    en: 'rating: () => `Your consultation is complete. Please tap the button on your screen to rate your visit.`,'
};

for (const [lang, msg] of Object.entries(ratingMessages)) {
    // We want to find the done: function for the specific language
    // It looks like:
    // lang: {
    //     joined: ...
    //     ...
    //     done: (clinic) => `...`,

    // We can use a regex to match the exact `done: (clinic) => \`...\`,` string that exists inside the block for this lang.
    // However, the `done:` line is unique enough per language if we just find the whole language block.

    const blockStartRegex = new RegExp(`(${lang}: \\{\\s*[\\s\\S]*?done: \\(clinic\\) => \`[^\`]*\`,)`);
    content = content.replace(blockStartRegex, `$1\n        ${msg}`);
}

fs.writeFileSync('lib/messaging.js', content);
console.log('Done modifying lib/messaging.js');
