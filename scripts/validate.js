const fs = require('fs');

const readmeFilePath = './README.md';
const versionFilePath = './version.json';

function extractUrlsFromReadme(content) {
    const pattern = /^\|[^|]+\|[^|]+\|\s*\[[^\]]+\]\((https:\/\/dldir1(v6)?\.qq\.com\/weixin\/android\/[^)]+)\)\s*\|/gm;
    const urls = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}

function findDuplicateUrls(urls, label) {
    const seen = new Map();
    const duplicates = [];

    for (const url of urls) {
        seen.set(url, (seen.get(url) || 0) + 1);
    }

    for (const [url, count] of seen.entries()) {
        if (count > 1) {
            duplicates.push(`${label}: ${url} (${count} 次)`);
        }
    }

    return duplicates;
}

function main() {
    const readme = fs.readFileSync(readmeFilePath, 'utf8');
    const versionEntries = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    const errors = [
        ...findDuplicateUrls(versionEntries.map(entry => entry.url), 'version.json 重复 URL'),
        ...findDuplicateUrls(extractUrlsFromReadme(readme), 'README.md 重复 URL')
    ];

    if (errors.length > 0) {
        console.error('校验失败:');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }

    console.log('校验通过');
}

main();
