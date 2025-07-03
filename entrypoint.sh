#!/bin/sh

JSON_STRING='window.configs = { \
  "VITE_BASE_URL":"'"${VITE_BASE_URL}"'", \
  "VITE_LOGIN_REDIRECT_BASE_URL": "'"${VITE_LOGIN_REDIRECT_BASE_URL}"'", \
  "VITE_WS_URL":"'"${VITE_WS_URL}"'" \
}'
echo Replacing CONFIGURATIONS_PLACEHOLDER to ${JSON_STRING}
sed -i "s@// CONFIGURATIONS_PLACEHOLDER@${JSON_STRING}@" /usr/share/nginx/html/index.html
cat /usr/share/nginx/html/index.html
