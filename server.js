const express = require("express");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));

// Auto-load sprites with nested structure support
app.get("/sprites", (req, res) => {
  const base = path.join(__dirname, "public", "sprites");
  const out = {};
  
  try {
    const items = fs.readdirSync(base);
    
    items.forEach(item => {
      const itemPath = path.join(base, item);
      
      if (fs.statSync(itemPath).isDirectory()) {
        // Check if this directory contains image files directly
        const contents = fs.readdirSync(itemPath);
        const hasImages = contents.some(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
        });
        
        if (hasImages) {
          // This is a simple emotion folder (old structure)
          out[item] = {
            type: 'simple',
            files: contents.filter(file => {
              const ext = path.extname(file).toLowerCase();
              return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
            })
          };
        } else {
          // This is a character/category folder with nested emotions
          const emotions = {};
          contents.forEach(subItem => {
            const subPath = path.join(itemPath, subItem);
            if (fs.statSync(subPath).isDirectory()) {
              const files = fs.readdirSync(subPath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
              });
              if (files.length > 0) {
                emotions[subItem] = files;
              }
            }
          });
          
          if (Object.keys(emotions).length > 0) {
            out[item] = {
              type: 'nested',
              emotions: emotions
            };
          }
        }
      }
    });
    
    res.json(out);
  } catch (err) {
    console.error('Error loading sprites:', err);
    res.json({});
  }
});

// Auto-load backgrounds
app.get("/backgrounds", (req, res) => {
  const bgPath = path.join(__dirname, "public", "bg");
  try {
    const files = fs.readdirSync(bgPath).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    res.json(files);
  } catch (err) {
    res.json([]);
  }
});

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

const wss = new WebSocket.Server({ server });

// GLOBAL STATE (everything lives here)
let state = {
  emotion: null,
  file: null,
  x: 0,
  y: 0,
  zoom: 1,
  background: null,
  dialogue: null,
  dialogueSettings: {
    typeSpeed: 50,
    fontFamily: 'Arial',
    fontSize: 24,
    boxWidth: 1100,
    boxHeight: 140,
    borderRadius: 8,
    positionX: 50,
    positionY: 40
  }
};

// Chat history with message limit
let chatMessages = [];
const MAX_MESSAGES = 100; // Only keep the last 100 messages

function addChatMessage(message) {
  chatMessages.push(message);
  
  // Remove oldest messages if we exceed the limit
  if (chatMessages.length > MAX_MESSAGES) {
    chatMessages = chatMessages.slice(-MAX_MESSAGES); // Keep only the last MAX_MESSAGES
  }
}

// Connection monitoring
let connectionCount = 0;
let viewerPresence = false;
let controllerPresence = false;

wss.on("connection", ws => {
  connectionCount++;
  console.log(`New connection. Total connections: ${connectionCount}`);
  
  // Send current state
  try {
    ws.send(JSON.stringify(state));
    
    // Send chat history
    ws.send(JSON.stringify({
      type: 'chatHistory',
      messages: chatMessages
    }));
    
    // Send current presence status
    ws.send(JSON.stringify({
      type: 'viewerPresence',
      active: viewerPresence
    }));
    
    ws.send(JSON.stringify({
      type: 'controllerPresence',
      active: controllerPresence
    }));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }

  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      
      // Handle different message types
      if (data.type === 'viewerMessage') {
        // Viewer sent a message
        const chatMessage = {
          sender: 'viewer',
          message: data.message,
          timestamp: data.timestamp
        };
        addChatMessage(chatMessage);
        console.log('Viewer message:', data.message);
        
        // Broadcast to all clients
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
            try {
              c.send(JSON.stringify({
                type: 'newChatMessage',
                ...chatMessage
              }));
            } catch (error) {
              console.error('Error broadcasting viewer message:', error);
            }
          }
        });
      } else if (data.type === 'controllerMessage') {
        // Controller sent a message (dialogue)
        const chatMessage = {
          sender: 'controller',
          message: data.message,
          timestamp: data.timestamp
        };
        addChatMessage(chatMessage);
        console.log('Controller message:', data.message);
        
        // Broadcast to all clients
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
            try {
              c.send(JSON.stringify({
                type: 'newChatMessage',
                ...chatMessage
              }));
            } catch (error) {
              console.error('Error broadcasting controller message:', error);
            }
          }
        });
      } else if (data.type === 'viewerPresence') {
        // Viewer presence update
        viewerPresence = data.active;
        console.log('Viewer presence:', viewerPresence);
        
        // Broadcast to all clients
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
            try {
              c.send(JSON.stringify({
                type: 'viewerPresence',
                active: viewerPresence
              }));
            } catch (error) {
              console.error('Error broadcasting viewer presence:', error);
            }
          }
        });
      } else if (data.type === 'controllerPresence') {
        // Controller presence update
        controllerPresence = data.active;
        console.log('Controller presence:', controllerPresence);
        
        // Broadcast to all clients
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
            try {
              c.send(JSON.stringify({
                type: 'controllerPresence',
                active: controllerPresence
              }));
            } catch (error) {
              console.error('Error broadcasting controller presence:', error);
            }
          }
        });
      } else {
        // Regular state update
        state = data;
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
            try {
              c.send(JSON.stringify(state));
            } catch (error) {
              console.error('Error broadcasting state:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    connectionCount--;
    console.log(`Connection closed. Total connections: ${connectionCount}`);
  });
  
  // Heartbeat to keep connection alive
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Ping clients every 30 seconds to keep connections alive
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      console.log('Terminating dead connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});
