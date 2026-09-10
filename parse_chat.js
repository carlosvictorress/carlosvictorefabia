const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('✨ Pré-Processador de Conversa do WhatsApp');
console.log('-------------------------------------------');

// 1. Procurar por arquivo .zip ou .txt na pasta atual
const files = fs.readdirSync(__dirname);
const targetZip = files.find(f => f.endsWith('.zip'));
const targetTxt = files.find(f => f.endsWith('.txt') && !f.startsWith('data'));

let rawText = '';

if (targetZip) {
  console.log(`📦 Encontrado arquivo ZIP: ${targetZip}`);
  const tempDir = path.join(__dirname, '_temp_extract');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  
  execSync(`powershell -Command "Expand-Archive -Path '${targetZip}' -DestinationPath '_temp_extract' -Force"`);
  
  const extractedFiles = fs.readdirSync(tempDir);
  const chatFile = extractedFiles.find(f => f.endsWith('.txt'));
  
  if (chatFile) {
    rawText = fs.readFileSync(path.join(tempDir, chatFile), 'utf8');
    console.log(`📄 Arquivo de texto extraído: ${chatFile}`);
  }
  
  fs.rmSync(tempDir, { recursive: true, force: true });
} else if (targetTxt) {
  console.log(`📄 Encontrado arquivo TXT: ${targetTxt}`);
  rawText = fs.readFileSync(path.join(__dirname, targetTxt), 'utf8');
} else {
  console.error('❌ Nenhum arquivo .zip ou .txt de conversa foi encontrado na pasta.');
  process.exit(1);
}

// 2. Executar o Parser
console.log('⏳ Processando e estruturando as mensagens...');

const bracketRegex = /^\[(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+([^:]+):\s*(.*)$/i;
const standardRegex = /^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i;

const lines = rawText.split(/\r?\n/);
const parsedMessages = [];
let currentMsg = null;
let msgId = 1;

function checkIsSaudade(text) {
  return /saudade|saudades|sinto sua falta|falta de você|queria estar com você|distância|longe de você/i.test(text);
}

function checkIsAmor(text) {
  return /te amo|amo você|meu amor|amor da minha vida|minha vida|te adoro|paixão|carinho|te quero/i.test(text);
}

function isSystemMessage(content, sender) {
  if (sender.includes('VCARD') || content.includes('BEGIN:VCARD')) return true;
  if (content.includes('criptografia de ponta a ponta') || content.includes('end-to-end encryption')) return true;
  if (content.includes('Mensagem apagada') || content.includes('This message was deleted')) return true;
  return false;
}

for (let line of lines) {
  line = line.trim();
  if (!line) continue;

  let match = line.match(bracketRegex) || line.match(standardRegex);

  if (match) {
    if (currentMsg) parsedMessages.push(currentMsg);

    const rawDateStr = match[1];
    const rawTimeStr = match[2];
    const sender = match[3].trim();
    const content = match[4].trim();

    if (isSystemMessage(content, sender)) {
      currentMsg = null;
      continue;
    }

    currentMsg = {
      id: 'msg_' + msgId++,
      rawDate: rawDateStr,
      rawTime: rawTimeStr,
      sender: sender,
      content: content,
      isSaudade: checkIsSaudade(content),
      isAmor: checkIsAmor(content)
    };
  } else if (currentMsg) {
    currentMsg.content += '\n' + line;
    currentMsg.isSaudade = currentMsg.isSaudade || checkIsSaudade(line);
    currentMsg.isAmor = currentMsg.isAmor || checkIsAmor(line);
  }
}

if (currentMsg) parsedMessages.push(currentMsg);

console.log(`✅ Sucesso! Total de ${parsedMessages.length} mensagens processadas.`);

// 3. Gerar arquivo data.js para o index.html carregar instantaneamente
const outputContent = `// Gerado automaticamente pelo parse_chat.js\nwindow.PRELOADED_CHAT_DATA = ${JSON.stringify(parsedMessages, null, 2)};\n`;

fs.writeFileSync(path.join(__dirname, 'data.js'), outputContent, 'utf8');

console.log('🚀 Arquivo "data.js" criado com sucesso!');
console.log('Agora a sua página "index.html" abrirá INSTANTANEAMENTE com a conversa real!');
