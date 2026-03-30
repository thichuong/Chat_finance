#!/bin/bash
# Install script for Chat Finance on Linux

echo "Chat Finance - Linux Installation"
echo "---------------------------------"

INSTALL_DIR="$HOME/.local/share/chat-finance"
DESKTOP_FILE="$HOME/.local/share/applications/chat-finance.desktop"

# Check if dist/ChatFinance exists
if [ ! -f "dist/ChatFinance" ]; then
    echo "Error: dist/ChatFinance binary not found. Please run 'python3 package_app.py' first."
    exit 1
fi

echo "Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/assets"

echo "Copying application binaries..."
cp dist/ChatFinance "$INSTALL_DIR/"
cp assets/icon.png "$INSTALL_DIR/assets/"

echo "Creating desktop entry..."
cat > "$DESKTOP_FILE" <<EOL
[Desktop Entry]
Version=1.0
Type=Application
Name=Chat Finance
Comment=Powerful AI Financial Chatbot
Exec=$INSTALL_DIR/ChatFinance
Icon=$INSTALL_DIR/assets/icon.png
Terminal=false
Categories=Office;Finance;
EOL

chmod +x "$DESKTOP_FILE"
echo "Installation complete!"
echo "You can now find 'Chat Finance' in your application menu."
