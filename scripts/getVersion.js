const fs = require('fs').promises;

const url = 'https://weixin.qq.com/cgi-bin/readtemplate?lang=zh_CN&t=weixin_faq_list';
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
                await updateREADME(updateInfo.text);
                await updateVersionFile(updateInfo);
                console.log(`${updateInfo.version_info}|${updateInfo.url}|${updateInfo.version}|${updateInfo.fileName}`);
            }
        }
    } catch (error) {
        console.error('发生错误:', error);
    }
}

async function updateREADME(text) {
    try {
        const data = await fs.readFile(readmeFilePath, 'utf8');
        const lines = data.split('\n');
        if (lines[19] !== text) {
            lines.splice(19, 0, text);
            const modifiedContent = lines.join('\n');
            await fs.writeFile(readmeFilePath, modifiedContent, 'utf8');
        }
    } catch (error) {
        console.error('更新 README 文件时出错:', error);
    }
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
        if (!existingEntry) {
            versionData.unshift({
                name: updateInfo.version_info,
                version: updateInfo.version,
                release_date: updateInfo.release_date,
                url: updateInfo.url,
                updated: new Date().getTime()
            });
            await fs.writeFile(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
        }
    } catch (error) {
        console.error('更新 version.json 文件时出错:', error);
    }
}

function getUpdateUri(html) {
    const pattern = /\/cgi-bin\/readtemplate\?lang=zh_CN&t=page\/faq\/android\/(\d+)\/index&faq=android_\1/;
    const matches = html.match(pattern);
    return matches ? `https://weixin.qq.com${matches[0]}` : false;
}

function getUpdateInfo(html) {
    const pattern_date = /发布日期： (\d{4}-\d{2}-\d{2})/;
    const pattern_version = /发布版本： (.*?)</;
    const pattern_link = /<a\s+href=(.*?)\s+target=_blank>下载最新版本<\/a>/i;
    const update_date = html.match(pattern_date);
    const update_version = html.match(pattern_version);
    const update_link = html.match(pattern_link);
    if (update_date && update_version && update_link) {
        return {
            text: `| ${update_version[1]} | (${update_date[1]}) | [${update_link[1]}](${update_link[1]}) |`,
            version_info: update_version[1],
            url: update_link[1],
            fileName: update_link[1].split('/')[5],
            version: update_version[1].split(' ')[1],
            release_date: update_date[1]
        };
    }
    return false;
}

get(url);