import fs from 'fs';

const path = 'src/components/SRTEDetailView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace activeTab type
content = content.replace(
  'const [activeTab, setActiveTab] = useState<"visao_geral" | "contratos" | "frota">("visao_geral");',
  'const [activeTab, setActiveTab] = useState<"visao_geral" | "frota">("visao_geral");'
);

// Remove the tab button for contratos
const buttonStart = content.indexOf('<button\n          onClick={() => { setActiveTab("contratos");');
if (buttonStart !== -1) {
  const buttonEnd = content.indexOf('</button>', buttonStart) + 9;
  content = content.slice(0, buttonStart) + content.slice(buttonEnd);
}

// Remove the TAB 2: GESTÃO DE CONTRATOS block
const tab2Start = content.indexOf('{/* TAB 2: GESTÃO DE CONTRATOS */}');
if (tab2Start !== -1) {
  const tab3Start = content.indexOf('{/* TAB 3: GESTÃO DE FROTA */}');
  if (tab3Start !== -1) {
    content = content.slice(0, tab2Start) + content.slice(tab3Start);
  }
}

// Write it back
fs.writeFileSync(path, content, 'utf8');
console.log('Stripped contratos tab from SRTEDetailView.tsx');
