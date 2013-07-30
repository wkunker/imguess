#!/bin/sh

forever start -e /home/ubuntu/imguess/server/imgrelay/error.log -l /home/ubuntu/imguess/server/imgrelay/forever.log -o /home/ubuntu/imguess/server/imgrelay/output.log imgrelay.js
