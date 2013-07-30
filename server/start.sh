#!/bin/sh

forever start -e /home/ubuntu/imguess/server/error.log -l /home/ubuntu/imguess/server/forever.log -o /home/ubuntu/imguess/server/output.log server.js
