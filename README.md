imguess
=======

http://imguess.com

A centralized chat service which gradually brings a blurred image into focus as two random users converse.

The goal of this project was not to develop using the latest and greatest of frontend web technologies,
but rather to establish an API that can be demonstrated as a use case for my up and coming project, Spect.

This project depends on NGINX to serve static HTML files.

See init/init.sh to get started.


Major components:

-Server - Controller for all API endpoints - handles "direct" (as in, behind a reverse proxy) requests from users.

-Imgrelay - Maintains track of all images in the filesystem, and ensures that each pair gets as unique an image as possible.

-Imgpull - Used to scrape random images from the internet, and store them on the server.


Thanks to: Github user jameydeorio for RandSense, which is used by the imgpull tool to generate a random sentence
and scrape image data with it.
