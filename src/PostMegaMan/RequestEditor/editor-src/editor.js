import {EditorState, Compartment} from '@codemirror/state';
import {EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, undo, redo} from '@codemirror/commands';
import {syntaxHighlighting, HighlightStyle, forceParsing} from '@codemirror/language';
import {json} from '@codemirror/lang-json';
import {tags} from '@lezer/highlight';

const bridge = document.getElementById('pm-meta');
const result = document.getElementById('pm-result');
const mount = document.getElementById('pm-editor');
const permission = new Compartment();
const limits = {bytes: 1024 * 1024, line: 128 * 1024};
let view = null;
let session = '';
let revision = 0;
let raw = '';
let mode = 'native';
let editable = false;
let nonSpaceCount = 0;
let error = '';
let presentationFrame = 0;
let geometryFrame = 0;
let observedGeometry = '';
let observedScroll = '';

const colors = HighlightStyle.define([
  {tag: tags.propertyName, color: '#1557a0'},
  {tag: tags.string, color: '#167447'},
  {tag: tags.number, color: '#7d3cb0'},
  {tag: tags.bool, color: '#9a4f09'},
  {tag: tags.null, color: '#666666'},
  {tag: tags.punctuation, color: '#333333'}
]);
const theme = EditorView.theme({
  '&': {height:'100%', backgroundColor:'#ffffff', fontSize:'14px'},
  '.cm-scroller': {overflow:'auto', fontFamily:'Consolas, "Courier New", monospace'},
  '.cm-content': {padding:'6px 0', minHeight:'100%'},
  '.cm-line': {padding:'0 8px'},
  '.cm-gutters': {backgroundColor:'#f5f5f5', color:'#888', borderRight:'1px solid #ddd'},
  '.cm-activeLine': {backgroundColor:'#f8fafc'},
  '.cm-cursor': {borderLeftColor:'#333'},
  '&.cm-focused': {outline:'none'},
  '.cm-selectionBackground': {backgroundColor:'#cde3fa !important'},
  // WebKit 1С иначе оставляет белый текст при прозрачном стандартном выделении.
  '.cm-content .cm-line::selection, .cm-content .cm-line ::selection': {
    color:'#202020 !important', backgroundColor:'#cde3fa !important'
  }
});

function countNonSpace(text) { return text.replace(/\s/g, '').length; }
function currentText() { return view ? view.state.sliceDoc() : raw; }
function updateMeta() {
  const doom = nonSpaceCount === 4 && currentText().trim().toLowerCase() === 'doom';
  bridge.value = JSON.stringify({ready:!error, session, revision, mode, editable, doom, error});
}
function separators(text) {
  const crlf = text.indexOf('\r\n') >= 0;
  const lf = /(^|[^\r])\n/.test(text);
  const cr = /\r(?!\n)/.test(text);
  return {mixed:Number(crlf)+Number(lf)+Number(cr)>1, value:crlf?'\r\n':cr?'\r':'\n'};
}
function clipboardText(text, state) {
  // Вставка использует переносы текущего документа; уже загруженное тело не меняем.
  return text.replace(/\r\n?|\n/g, state.lineBreak);
}
function regularSize(text) {
  if (text.length > limits.bytes) return false;
  let length = 0;
  for (let i=0;i<text.length;i++) {
    if (text.charCodeAt(i) === 10 || text.charCodeAt(i) === 13) length=0;
    else if (++length > limits.line) return false;
  }
  return true;
}
function dispose() {
  window.cancelAnimationFrame(presentationFrame);
  window.cancelAnimationFrame(geometryFrame);
  presentationFrame=0; geometryFrame=0; observedGeometry=''; observedScroll='';
  mount.style.opacity='0';
  if (view) { view.destroy(); view=null; }
  mount.textContent='';
}
function geometryOf(editor) {
  const style=window.getComputedStyle(editor.contentDOM);
  return [editor.scrollDOM.clientWidth,editor.scrollDOM.clientHeight,
    window.innerWidth,window.innerHeight,window.devicePixelRatio,
    style.fontSize,style.lineHeight].join('|');
}
function preparePresentation(editor) {
  mount.style.opacity='0';
  editor.requestMeasure({key:mount,
    read:current => ({geometry:geometryOf(current),visible:current.inView}),
    write:measured => {
      if (view!==editor) return;
      window.cancelAnimationFrame(presentationFrame);
      // Следующий кадр исполняется после завершения измерения CodeMirror и компоновки 1С.
      presentationFrame=window.requestAnimationFrame(() => {
        presentationFrame=0;
        if (view!==editor) return;
        const geometry=geometryOf(editor);
        if (geometry!==measured.geometry) { preparePresentation(editor); return; }
        if (!measured.visible) return;
        forceParsing(editor,editor.viewport.to,20);
        mount.style.opacity='1';
      });
    }
  });
}
function watchGeometry(editor) {
  if (typeof window.ResizeObserver==='function' && typeof window.IntersectionObserver==='function') return;
  // Старый встроенный WebKit не сообщает CodeMirror об изменении размеров HTML-поля.
  geometryFrame=window.requestAnimationFrame(() => {
    geometryFrame=0;
    if (view!==editor) return;
    const scroll=editor.scrollDOM.scrollTop+'|'+editor.scrollDOM.scrollLeft;
    if (typeof window.IntersectionObserver!=='function' && scroll!==observedScroll) {
      // WebKit может доставить событие прокрутки уже после начала следующего кадра.
      measureScroll(editor);
    }
    const geometry=geometryOf(editor);
    if (geometry!==observedGeometry) {
      observedGeometry=geometry;
      preparePresentation(editor);
    }
    watchGeometry(editor);
  });
}
function measureScroll(editor) {
  editor.requestMeasure();
  // Публичное чтение геометрии завершает ожидающее измерение до показа кадра.
  editor.lineBlockAtHeight(editor.scrollDOM.scrollTop);
  observedScroll=editor.scrollDOM.scrollTop+'|'+editor.scrollDOM.scrollLeft;
}
function install(text, nextSession, allowed) {
  dispose();
  session=nextSession; revision=0; raw=text; editable=allowed; error='';
  nonSpaceCount=countNonSpace(text);
  const separator=separators(text);
  mode=separator.mixed || !regularSize(text) ? 'native' : 'json';
  if (mode==='json') {
    view = new EditorView({parent:mount, state:EditorState.create({doc:text, extensions:[
      EditorState.lineSeparator.of(separator.value),
      permission.of([EditorState.readOnly.of(!allowed), EditorView.editable.of(allowed)]),
      lineNumbers(), drawSelection(), highlightActiveLine(), history(),
      keymap.of([...defaultKeymap, ...historyKeymap]), json(), syntaxHighlighting(colors), theme,
      EditorView.clipboardInputFilter.of(clipboardText),
      EditorView.updateListener.of(update => {
        // Подготавливаем новые видимые строки до отрисовки, без фонового появления цветов.
        if (update.viewportChanged && !update.docChanged) {
          forceParsing(update.view, update.view.viewport.to, 20);
        }
        if (!update.docChanged) return;
        update.changes.iterChanges((fromA,toA,fromB,toB,inserted) => {
          nonSpaceCount+=countNonSpace(inserted.toString())
            -countNonSpace(update.startState.sliceDoc(fromA,toA));
        });
        revision++;
        updateMeta();
        let oversized=update.state.doc.length>limits.bytes;
        update.changes.iterChangedRanges((fromA,toA,fromB,toB) => {
          if (update.state.doc.lineAt(fromB).length>limits.line || update.state.doc.lineAt(toB).length>limits.line) oversized=true;
        });
        if (oversized) {
          const changedView=view;
          window.setTimeout(() => {
            if (view!==changedView) return;
            raw=currentText(); mode='native'; dispose(); updateMeta();
          },0);
        }
      }),
      EditorView.domEventHandlers({scroll:(_event,editor) => {
        // Без IntersectionObserver CodeMirror пропускает измерение при прокрутке.
        if (typeof window.IntersectionObserver!=='function') {
          measureScroll(editor);
        }
        return false;
      },paste:event => {
        if (view.state.readOnly) return false;
        const pasted=event.clipboardData && event.clipboardData.getData('text/plain');
        if (!pasted) return false;
        const range=view.state.selection.main;
        const combined=view.state.sliceDoc(0,range.from)+clipboardText(pasted,view.state)+view.state.sliceDoc(range.to);
        if (regularSize(combined)) return false;
        event.preventDefault();
        raw=combined;
        nonSpaceCount=countNonSpace(raw); revision++; mode='native';
        dispose(); updateMeta(); return true;
      }})
    ]})});
    observedGeometry=geometryOf(view);
    observedScroll=view.scrollDOM.scrollTop+'|'+view.scrollDOM.scrollLeft;
    preparePresentation(view);
    watchGeometry(view);
  }
  updateMeta();
}
function execute(command) {
  if (command.op!=='set' && command.session!==session) throw new Error('Сеанс редактора изменился.');
  if (command.op==='set') install(command.text,command.session,command.editable);
  else if (command.op==='readonly') {
    if (command.session!==session) throw new Error('Сеанс редактора изменился.');
    editable=command.editable;
    if (view) view.dispatch({effects:permission.reconfigure([
      EditorState.readOnly.of(!editable),EditorView.editable.of(editable)
    ])});
    if (view) preparePresentation(view);
    updateMeta();
  } else if (command.op==='destroy') { dispose(); mode='native'; updateMeta(); }
  else if (command.op!=='snapshot') throw new Error('Неизвестная команда редактора.');
  const reply={ok:true,session,revision,mode};
  if (command.op==='snapshot') reply.text=currentText();
  result.value=JSON.stringify(reply);
}
document.getElementById('pm-go').onclick=() => {
  try { execute(JSON.parse(document.getElementById('pm-command').value)); }
  catch (failure) {
    result.value=JSON.stringify({ok:false,session,error:String(failure)});
  }
};
window.addEventListener('unload',dispose);
// Тестовый код добавляется только в отдельный прототип, не в ресурсы EPF.
if (PM_TEST_MODE) window.postMegaManEditorProbe={get view(){return view;},install,execute,updateMeta,limits,undo,redo};
updateMeta();
