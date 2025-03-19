#!/bin/bash

function gh_login() {
    gh auth login --with-token $GHTOKEN
    git config --global user.email "actions@github.com"
    git config --global user.name "GithubActions"    
}

function check_update() {
    wechat_info=`node scripts/getVersion.js`
    if [ $? -eq 0 ] && [ ! -z "$wechat_info" ]; then
        IFS="|" read -ra parts <<< "$wechat_info"
        version_info="${parts[0]}"
        download_link="${parts[1]}"
        version="${parts[2]}"
        file_name="${parts[3]}"
        echo "$version_info|$download_link|$version|$file_name" > .version_info
        return 0
    fi
    return 1
}

function main() {
    now_sum256=`shasum -a 256 README.md | awk '{print $1}'`
    gh_login
    check_update    
    latest_sum256=`shasum -a 256 README.md | awk '{print $1}'`
    if [ "$now_sum256" != "$latest_sum256" ]; then
        git add README.md version.json && git commit -m "$version_info" && git push origin main
        exit 0
    fi
    exit 1
}

main
