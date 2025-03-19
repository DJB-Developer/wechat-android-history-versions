#!/bin/bash

function gh_login() {
    gh auth login --with-token $GHTOKEN
    git config --global user.email "actions@github.com"
    git config --global user.name "GithubActions"    
}

function read_version_info() {
    if [ ! -f .version_info ]; then
        echo "版本信息文件不存在"
        exit 1
    fi
    
    IFS="|" read -ra parts < .version_info
    version_info="${parts[0]}"
    download_link="${parts[1]}"
    version="${parts[2]}"
    file_name="${parts[3]}"
}

function wechat_download() {
    mkdir -p wechatAndroid
    wget -q "$download_link" -O wechatAndroid/$file_name
    if [ "$?" -ne 0 ]; then
        >&2 echo -e "下载失败，请检查网络连接！"
        rm -rf wechatAndroid
        exit 1
    fi
}

function prepare_release() {
    apk_sum256=`shasum -a 256 wechatAndroid/$file_name | awk '{print $1}'`
    apk_version="$version_info "`date -u '+%Y%m%d'`
    echo "发布版本: $version" > ./wechatAndroid/$file_name.sha256
    echo "更新日期: $(date -u '+%Y-%m-%d %H:%M:%S') (UTC)" >> ./wechatAndroid/$file_name.sha256
    echo "下载地址: $download_link" >> ./wechatAndroid/$file_name.sha256
    echo "Sha256: $apk_sum256" >> ./wechatAndroid/$file_name.sha256
    
    gh release create v"$version"_`date -u '+%Y%m%d'` ./wechatAndroid/$file_name -F ./wechatAndroid/$file_name.sha256 -t "$apk_version"
    if [ "$?" -ne 0 ]; then
        echo "发布 Release 失败"
        exit 1
    fi
    rm -rf wechatAndroid
    rm -f .version_info
}

function main() {
    gh_login
    read_version_info
    wechat_download
    prepare_release
}

main 