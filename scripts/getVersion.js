const fs = require('fs').promises;

const url = 'https://weixin.qq.com/updates';
const readmeFilePath = './README.md';
const versionFilePath = './version.json';

async function get(url) {
    try {
        const response = await fetch(url);
        const data = await response.text();
        const updateUrl = getUpdateUri(data);
        if (updateUrl) {
            const updateResp = await fetch(updateUrl);
            const updateData = await updateResp.text();
            const updateInfo = getUpdateInfo(updateData);
            if (updateInfo) {
                const added = await updateREADME(updateInfo);
                const versionAdded = await updateVersionFile(updateInfo);
                if (added || versionAdded) {
                    console.log(`${updateInfo.version_info}|${updateInfo.url}|${updateInfo.version}|${updateInfo.fileName}`);
                }
            }
        }
    } catch (error) {
        console.error('发生错误:', error);
    }
}

async function updateREADME(updateInfo) {
    try {
        const data = await fs.readFile(readmeFilePath, 'utf8');
        if (data.includes(updateInfo.url)) {
            return false;
        }

        const lines = data.split('\n');
        const tableHeaderIndex = lines.findIndex(line =>
            line.includes('|  :----  | :----  | :----  |')
        );

        if (tableHeaderIndex !== -1) {
            lines.splice(tableHeaderIndex + 1, 0, updateInfo.text);
            await fs.writeFile(readmeFilePath, lines.join('\n'), 'utf8');
            return true;
        }
    } catch (error) {
        console.error('更新 README 文件时出错:', error);
    }
    return false;
}

async function updateVersionFile(updateInfo) {
    try {
        let versionData = [];
        try {
            versionData = JSON.parse(await fs.readFile(versionFilePath, 'utf8'));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        const existingEntry = versionData.find(entry => entry.url === updateInfo.url);
        if (existingEntry) {
            return false;
        }

        versionData.unshift({
            name: updateInfo.version_info,
            version: updateInfo.version,
            publish_date: updateInfo.publish_date,
            url: updateInfo.url,
            updated: new Date().getTime()
        });
        await fs.writeFile(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('更新 version.json 文件时出错:', error);
    }
    return false;
}

function getUpdateUri(html) {
    const pattern = /<section id="android"[^>]*>[\s\S]*?<ul class="faq_section_sublist"[^>]*>[\s\S]*?<li class="faq_section_sublist_item"[^>]*>[\s\S]*?<span class="version"[^>]*>([\d.]+)<\/span>/;
    const match = html.match(pattern);
    if (match) {
        const version = match[1].trim();
        const versionNum = version.replace(/\./g, '');
        return `https://weixin.qq.com/api/updates_items?platform=android&version=${versionNum}`;
    }
    return false;
}

function getUpdateInfo(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        return {
            text: `| 微信 ${data.version} for Android  | (${data.publishDate}) | [${data.version} Android](${data.downloadUrl}) |`,
            version_info: `微信 ${data.version} for Android`,
            url: data.downloadUrl,
            fileName: data.downloadUrl.split('/').pop(),
            version: data.version,
            publish_date: data.publishDate
        };
    } catch (error) {
        console.error('解析JSON数据时出错:', error);
        return false;
    }
}

get(url);
