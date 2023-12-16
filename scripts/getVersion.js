
const url = 'https://weixin.qq.com/cgi-bin/readtemplate?lang=zh_CN&t=weixin_faq_list';

get(url);

async function get(url) {
    try {
        const response = await fetch(url);
        const data = await response.text();
        const updateUrl = getUpdateUri(data);
        // console.log(updateUrl);
        if(updateUrl) {
            const updateResp = await fetch(updateUrl);
            const updateData = await updateResp.text();
            const updateInfo = getUpdateInfo(updateData);   
            // console.log(updateInfo);
            if(updateInfo) {                
                updateREADME(updateInfo.text);
                console.log(`${updateInfo.version_info}|${updateInfo.url}|${updateInfo.version}|${updateInfo.fileName}`);
            }                     
        }     
    } catch (error) {
        console.error('发生错误:', error);
    }
}

function updateREADME(text)
{
    const fs = require('fs');
    const filePath = './README.md';
    
    fs.readFile(filePath, 'utf8', (error, data) => {
      if (error) {
        console.error('读取文件时出错:', error);
        return;
      }
    
      const lines = data.split('\n');

      if(lines[19] != text) {
        lines.splice(19, 0, text);        
        const modifiedContent = lines.join('\n');
        fs.writeFile(filePath, modifiedContent, 'utf8', (error) => {
            if (error) {
                console.error('写入文件时出错:', error);
            }
        });
      }

    });
}

function getUpdateUri(html)
{
    const pattern = /\/cgi-bin\/readtemplate\?lang=zh_CN&t=page\/faq\/android\/(\d+)\/index&faq=android_\1/;
    const matches = html.match(pattern);
    if(matches) {
        // console.log(matches[0]);
        return `https://weixin.qq.com${matches[0]}`;
    }
    return false;
}

function getUpdateInfo(html)
{
    const pattern_date = /发布日期： (\d{4}-\d{2}-\d{2})/;
    const pattern_version = /发布版本： (.*?)</;
    const pattern_link = /<a\s+href=(.*?)\s+target=_blank>下载最新版本<\/a>/i;
    const update_date = html.match(pattern_date);
    const update_version = html.match(pattern_version);
    const update_link = html.match(pattern_link);
    if(update_date && update_version && update_link) {
        // console.log(update_date[1]);
        // console.log(update_version[1]);
        // console.log(update_link[1]);
        return {
            text: `| ${update_version[1]} | (${update_date[1]}) | [${update_link[1]}](${update_link[1]}) |`,
            version_info: update_version[1],
            url: update_link[1],
            fileName: update_link[1].split('/')[5],
            version: update_version[1].split(' ')[1]
        };
    }
    
    return false;
}
