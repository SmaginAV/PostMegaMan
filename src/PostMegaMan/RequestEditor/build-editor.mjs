import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build,transform} from 'esbuild';
import {transformAsync} from '@babel/core';
import presetEnv from '@babel/preset-env';
const buildResult=await build({entryPoints:['editor-src/editor.js'],bundle:true,write:false,
  minify:false,format:'iife',target:['esnext'],legalComments:'inline',metafile:true,
  define:{PM_TEST_MODE:process.argv.includes('--probe')?'true':'false'}});
const translated=await transformAsync(buildResult.outputFiles[0].text,{babelrc:false,configFile:false,
  presets:[[presetEnv,{targets:{safari:'11'},modules:false}]],sourceType:'script'});
const compact=await transform(translated.code,{minify:true,target:['es2015'],legalComments:'inline'});
const code=compact.code.replace(/<\/script/gi,'<\\/script');
// Функция замены сохраняет буквальные $& в минифицированном JavaScript.
let html=readFileSync('editor-src/shell.html','utf8').replace('__EDITOR_BUNDLE__',() => code);
if (html.includes('__EDITOR_BUNDLE__')) throw new Error('Unresolved editor template placeholder');
const runtimePackages=new Set(Object.keys(buildResult.metafile.inputs).filter(path=>path.startsWith('node_modules/'))
  .map(path=>path.match(/^node_modules\/(@[^/]+\/[^/]+|[^/]+)/)[1]));
let notices='';
for (const name of runtimePackages) {
  const dir='node_modules/'+name;
  const licenseFile=readdirSync(dir).find(file=>/^licen[cs]e(\.|$)/i.test(file));
  if (!licenseFile) throw new Error('Missing license: '+name);
  const version=JSON.parse(readFileSync(dir+'/package.json','utf8')).version;
  notices+='\n'+name+' '+version+'\n'+readFileSync(dir+'/'+licenseFile,'utf8');
}
html=html.replace('</body>','<!-- Dependency licenses'+notices.replace(/-->/g,'--&gt;')+'\n--></body>');
if (process.argv.includes('--bench')) {
  html=html.replace('</body>', '<script>'+readFileSync('editor-src/bench.js','utf8').replace(/<\/script/gi,'<\\/script')+'</script></body>');
}
writeFileSync('editor.html',html);
writeFileSync('bundle-meta.json',JSON.stringify(buildResult.metafile,null,2));
console.log(JSON.stringify({bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')}));
