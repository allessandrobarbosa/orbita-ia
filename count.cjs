const fs=require('fs');
const path=require('path');
const dir=path.join('C:/Projetos/orbita-projeto/data/tcu/acordaos');
const unique=new Set();
fs.readdirSync(dir).forEach(f=>{
  if(f.endsWith('.csv')){
    const c=fs.readFileSync(path.join(dir,f),'latin1');
    c.split('\n').slice(2).forEach(l=>{
      const p=l.split('""');
      if(p.length>=5){
        const m=p[0].match(/(\d+)\/(\d{4})/);
        if(m) unique.add(m[1]+'-'+m[2]);
      }
    });
  }
});
console.log('Unique Acordaos:', unique.size);
