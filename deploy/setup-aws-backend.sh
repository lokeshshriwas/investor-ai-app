#!/bin/bash
# AWS EC2 Ubuntu 22.04 Setup Script for Investor AI (Backend ONLY)
# Best used when Frontend is hosted on Vercel
set -e

echo "=== [1/5] System Update & Dependencies ==="
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git curl

echo "=== [2/5] Swap file (1 GB) ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    echo "Swap created."
else
    echo "Swap already exists."
fi

echo "=== [3/5] App Directory Validation ==="
# Find project directory (handles ~/investor-ai, ~/investor-ai-app, or current dir)
if [ -d "$HOME/investor-ai-app" ]; then
    APP_DIR="$HOME/investor-ai-app"
elif [ -d "$HOME/investor-ai" ]; then
    APP_DIR="$HOME/investor-ai"
elif [ -d "$(pwd)/backend" ]; then
    APP_DIR="$(pwd)"
else
    echo "ERROR: Code not found at ~/investor-ai or ~/investor-ai-app"
    echo "Please clone or upload your code first."
    exit 1
fi
echo "Using project directory: $APP_DIR"

echo "=== [4/5] Backend Setup (FastAPI) ==="
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install --no-cache-dir -r requirements-prod.txt

# Create Backend Systemd Service
cat << EOF | sudo tee /etc/systemd/system/investor-ai-backend.service
[Unit]
Description=Investor AI FastAPI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable investor-ai-backend
sudo systemctl restart investor-ai-backend

echo "=== [5/5] Nginx Configuration ==="
# Notice: No Next.js configuration here. Everything proxies to backend.
cat << 'EOF' | sudo tee /etc/nginx/sites-available/investor-ai
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/investor-ai /etc/nginx/sites-enabled/investor-ai
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=== BACKEND SETUP COMPLETE ==="
echo "Your API is now running. Remember to set up CORS in backend/main.py for your Vercel URL!"
