#!/bin/bash
set -e # exit on first error



# Load environment variables
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  echo ".env file not found!"
  exit 1
fi

echo "Building web frontent..."
npm run build --prefix $LOCAL_WEB_PATH

echo "Building server"
npm run build --prefix $LOCAL_SERVER_PATH

echo "Deploying web frontent..."
rsync -avz -e "ssh -p $SSH_PORT -i $SSH_KEY" $LOCAL_WEB_PATH/dist/ $SSH_USER@$SSH_HOST:$WEB_REMOTE_PATH

echo "Deploying server..."
rsync -avz -e "ssh -p $SSH_PORT -i $SSH_KEY" $LOCAL_SERVER_PATH/build/ $SSH_USER@$SSH_HOST:$SERVER_REMOTE_PATH
ssh $SSH_USER@$SSH_HOST -p $SSH_PORT -i $SSH_KEY "pm2 restart /srv/spread/server/server/src/index.js"

echo "Deploy complete!"