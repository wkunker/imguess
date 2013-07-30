#!/bin/bash

##
## A bash script to configure and install project dependencies.
##
## This script must be run from the <%project_root%/server> directory
##

sudo apt-get install nginx
sudo cp NGINX_sites-enabled_default /etc/nginx/sites-enabled/default
sudo service nginx restart
if [ "$(which node)"!="/usr/local/bin/node" ] ; then
    wget http://nodejs.org/dist/v0.10.13/node-v0.10.13.tar.gz
    tar xvzf node-v0.10.13.tar.gz
    sudo apt-get install gcc g++ make
    cd node-v0.10.13
    ./configure
    make
    sudo make install
    cd ./..
fi
cd ./../server
npm install
cd ./scraper
npm install

echo "======================"
echo "Configuration complete"
echo "======================"
echo ""
echo "Please be sure to configure server_name /etc/nginx/sites-enabled/default, then restart nginx."
echo "config.js also must exist in the project root (see config-SAMPLE.js in project root)"
