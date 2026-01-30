const express = require("express");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));

// Auto-load sprites
app.get("/sprites", (req, res) => {
  const base = path.join(__dirname, "public", "sprites");
  const out = {};
  try {
    if (!fs.existsSync(base)) return res.json({});
    const items = fs.readdirSync(base);
    items.forEach(item => {
      const itemPath = path.join(base, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const contents = fs.readdirSync(itemPath);
        const hasImages = contents.some(file => ['.png','.jpg','.jpeg','.gif','.webp'].includes(path.extname(file).toLowerCase()));
        if (hasImages) {
          out[item] = { type:'simple', files:contents.filter(f=>['.png','.jpg','.jpeg','.gif','.webp'].includes(path.extname(f).toLowerCase())) };
        } else {
          const emotions = {};
          contents.forEach(subItem => {
            const subPath = path.join(itemPath, subItem);
            if (fs.statSync(subPath).isDirectory()) {
              const files = fs.readdirSync(subPath).filter(f=>['.png','.jpg','.jpeg','.gif','.webp'].includes(path.extname(f).toLowerCase()));
              if (files.length > 0) emotions[subItem] = files;
            }
          });
          if (Object.keys(emotions).length > 0) out[item] = { type:'nested', emotions };
        }
      }
    });
    res.json(out);
  } catch(e) { res.json({}); }
});

app.get("/backgrounds", (req, res) => {
  const p = path.join(__dirname, "public", "bg");
  try {
    if (!fs.existsSync(p)) return res.json([]);
    res.json(fs.readdirSync(p).filter(f=>['.png','.jpg','.jpeg','.gif','.webp'].includes(path.extname(f).toLowerCase())));
  } catch(e) { res.json([]); }
});

app.get("/music", (req, res) => {
  const p = path.join(__dirname, "public", "music");
  try {
    if (!fs.existsSync(p)) return res.json([]);
    res.json(fs.readdirSync(p).filter(f=>['.mp3','.ogg','.wav','.m4a'].includes(path.extname(f).toLowerCase())));
  } catch(e) { res.json([]); }
});

app.get("/sounds", (req, res) => {
  const p = path.join(__dirname, "public", "sounds");
  try {
    if (!fs.existsSync(p)) return res.json([]);
    res.json(fs.readdirSync(p).filter(f=>['.mp3','.ogg','.wav'].includes(path.extname(f).toLowerCase())));
  } catch(e) { res.json([]); }
});

const server = app.listen(PORT, () => console.log(`Server on port ${PORT}`));
const wss = new WebSocket.Server({ server });

const state = {
  visual: { emotion:null, file:null, x:0, y:0, zoom:1 },
  environment: { background:null, music:null, musicVolume:0.5 },
  dialogue: { text:null, characterName:'', typeSound:null, settings:{ typeSpeed:50, fontFamily:'Arial', fontSize:24, boxWidth:800, boxHeight:160, borderRadius:8, positionX:35, positionY:40 }},
  presence: { controllerActive:false, viewerActive:false }
};

const chatMessages = [];
const MAX_MESSAGES = 100;

wss.on("connection", ws => {
  console.log('New connection');
  try {
    ws.send(JSON.stringify({type:'visualState',data:state.visual}));
    ws.send(JSON.stringify({type:'environmentState',data:state.environment}));
    ws.send(JSON.stringify({type:'dialogueState',data:state.dialogue}));
    ws.send(JSON.stringify({type:'presenceState',data:state.presence}));
    ws.send(JSON.stringify({type:'chatHistory',messages:chatMessages}));
  } catch(e) {}
  
  ws.on("message", msg => {
    try {
      const d = JSON.parse(msg);
      if(d.type==='updateVisual') {
        Object.assign(state.visual,d.data);
        broadcast({type:'visualState',data:state.visual});
      } else if(d.type==='updateEnvironment') {
        Object.assign(state.environment,d.data);
        broadcast({type:'environmentState',data:state.environment});
      } else if(d.type==='updateDialogue') {
        if(d.data.text!==undefined) state.dialogue.text=d.data.text;
        if(d.data.characterName!==undefined) state.dialogue.characterName=d.data.characterName;
        if(d.data.typeSound!==undefined) state.dialogue.typeSound=d.data.typeSound;
        broadcast({type:'dialogueState',data:state.dialogue});
      } else if(d.type==='updateDialogueSettings') {
        Object.assign(state.dialogue.settings,d.data);
        broadcast({type:'dialogueState',data:state.dialogue});
      } else if(d.type==='viewerMessage') {
        const m={sender:'viewer',message:d.message,timestamp:d.timestamp};
        chatMessages.push(m);
        if(chatMessages.length>MAX_MESSAGES) chatMessages.shift();
        broadcast({type:'newChatMessage',...m});
      } else if(d.type==='controllerMessage') {
        const m={sender:'controller',message:d.message,timestamp:d.timestamp};
        chatMessages.push(m);
        if(chatMessages.length>MAX_MESSAGES) chatMessages.shift();
        broadcast({type:'newChatMessage',...m});
      } else if(d.type==='viewerPresence') {
        state.presence.viewerActive=d.active;
        broadcast({type:'presenceState',data:state.presence});
      } else if(d.type==='controllerPresence') {
        state.presence.controllerActive=d.active;
        broadcast({type:'presenceState',data:state.presence});
      }
    } catch(e) {}
  });
  
  ws.isAlive=true;
  ws.on('pong',()=>{ws.isAlive=true;});
  ws.on('close',()=>console.log('Connection closed'));
});

function broadcast(msg) {
  const s=JSON.stringify(msg);
  wss.clients.forEach(c=>{if(c.readyState===WebSocket.OPEN) try{c.send(s);}catch(e){}});
}

setInterval(()=>{
  wss.clients.forEach(ws=>{
    if(!ws.isAlive) return ws.terminate();
    ws.isAlive=false;
    ws.ping();
  });
},30000);
