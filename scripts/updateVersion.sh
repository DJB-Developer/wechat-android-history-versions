#!/bin/bash

function gh_login() {
    gh auth login --with-token $GHTOKEN
    git config --global user.email "actions@github.com"
    git config --global user.name "GithubActions"    
}

function check_update() {
    wechat_info=`node scripts/getVersion.js`
    IFS="|" read -ra parts <<< "$wechat_info"
    version_info="${parts[0]}"
    download_link="${parts[1]}"
    version="${parts[2]}"
    file_name="${parts[3]}"
}

function wechat_download() {
    mkdir -p wechatAndroid
    wget -q "$download_link" -O wechatAndroid/$file_name
    if [ "$?" -ne 0 ]; then
        >&2 echo -e "Download Failed, please check your network!"
        exit
    fi
    prepare_commit
}

function prepare_commit() {
    apk_sum256=`shasum -a 256 wechatAndroid/$file_name | awk '{print $1}'`
    apk_version="$version_info"`date -u '+%Y%m%d'`
    echo "发布版本：$version" > ./wechatAndroid/$file_name.sha256
    echo "更新日期: $(date -u '+%Y-%m-%d %H:%M:%S') (UTC)" >> ./wechatAndroid/$file_name.sha256
    echo "下载地址: $download_link" >> ./wechatAndroid/$file_name.sha256
    echo "Sha256: $apk_sum256" >> ./wechatAndroid/$file_name.sha256
    gh release create v"$version"_`date -u '+%Y%m%d'` -F ./wechatAndroid/$file_name.sha256 -t "$apk_version"
    rm -rfv wechatAndroid
}

function main() {
    now_sum256=`shasum -a 256 README.md | awk '{print $1}'`
    gh_login
    check_update
    wechat_download
    latest_sum256=`shasum -a 256 README.md | awk '{print $1}'`
    if [ "$now_sum256" != "$latest_sum256" ]; then
        git add . && git commit -m "$version_info" && git push origin main
    fi        
}

main
