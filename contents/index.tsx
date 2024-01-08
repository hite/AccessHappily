import { useEffect, useState, type FormEvent } from "react";
import eventEmitter, { EventEmitter} from "~EventEmitter";
import { builtinCSSInHost, getRules, getSelector, isMatched, type IRuleAction } from "~rules";
import { FaQuestionCircle } from "react-icons/fa";
import { RuleActionType, builtinRule } from "~rules";
// 这里很关键：引入基础样式，否则按钮没有背景色（rippleUI）
// import "./standalone.scss";
import "../style.css";

import { Storage } from "@plasmohq/storage"
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';
const kDBKeySettings = 'kDBKeySettings';
// 生成文本
// import styleText from "data-text:./standalone.scss";
import styleText from "data-text:../style.css";
import type { PlasmoGetStyle } from "plasmo";

  // injectAnchor 的时候会注入 样式文件
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  // https://github.com/PlasmoHQ/plasmo/issues/835
  style.textContent = styleText;
  // console.log(styleText2);
  return style
}

const kEventKeyContextMenus = 'kEventKeyContextMenus';
const kEventKeyEnableCopy = 'kEventKeyEnableCopy';
const kEventKeyExportText = 'kEventKeyExportText';
const kEventKeyPickingElement = 'kEventKeyPickingElement';
// const eventEmitter = new EventEmitter();

const setStyle = (styleText, num) => {
  const style = document.createElement("style")
  style.textContent = styleText
  style.type = "text/css";
  style.id = 'access-happily';
  style.setAttribute('data-name', 'ah_style_' + num);
  document.head.appendChild(style);
}

const activeRules = [];
async function logRule(_rule) {
  activeRules.push(_rule);

  sendToPop({
    action: 'logRuleExecuted',
    data: activeRules.length
  });
}

function nativeTreeWalker(targetContent) {
  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  var node;

  while (node = walker.nextNode()) {
    let value = node.nodeValue.trim();
    if (value == targetContent) {
      return node;
    }
  }
  return null;
}

function sendToPop(_data) {
  // send message to popup
  chrome.runtime.sendMessage(_data);
}
////
let kExecutingTasks = {}
function isExecuting(rule: IRuleAction): boolean {
  let key = 'k'+rule.name + rule.type + rule.data;
  return kExecutingTasks[key];
}
function markExecuting(rule: IRuleAction, ongoing: boolean) {
  let key = 'k'+rule.name + rule.type + rule.data;
  kExecutingTasks[key] = ongoing;
}
/////

async function executeRule(obj: IRuleAction, onFinish: (message: string)=> void) {
    let type = obj.type, data = obj.data;
    if(isExecuting(obj)) {
      console.info('the same rule is executing', obj.name);
      return;
    }
    markExecuting(obj, true);

    let elements: any[] = [];
    if (data.startsWith(':contains(')) {
      // :contains('继续前往')
      let rawContent = data.replace(':contains(', '');
      let targetContent = rawContent.substring(1, rawContent.length - 2);
      let textNode = nativeTreeWalker(targetContent);

      if (textNode) {
        elements = [textNode.parentNode];
      }
    } else {
      document.querySelectorAll(data).forEach((element)=>{
        elements.push(element);
      });
    }

    if (elements.length > 0) {
      if (type ==  RuleActionType.autoHide) {
        elements.forEach((e)=>{
          e.style = 'position:absolute !important;right: -10000px !important;';
        });
        onFinish('已自动隐藏元素， 规则名 ：' + obj.name);
        markExecuting(obj, false);
      } else if (type == RuleActionType.autoNavigate) {
        let firstOne = elements[0];
        let link = firstOne.value || firstOne.innerText;
        let autoHideDelay = await getDefaultValue('autoHideDelay');
        if(isNaN(autoHideDelay)) {
          autoHideDelay = 1;
        }
        window.setTimeout(() => {
          window.location.assign(link);
          onFinish('已自动跳转到页面 ' + link + '， 规则名 ：' + obj.name);
          markExecuting(obj, false);
        }, autoHideDelay * 1000);
      } else {
        let autoClickDelay = await getDefaultValue('autoClickDelay');
        if(isNaN(autoClickDelay)) {
          autoClickDelay = 1;
        }
        window.setTimeout(() => {
          elements.forEach((e)=>{
            e.click();
          });
          onFinish('已自动点击元素， 规则名 ：' + obj.name);
          markExecuting(obj, false);
        }, autoClickDelay * 1000);
      }
      //
      sendToPop(obj);
      logRule(obj);
    } else {
      console.info('Not found target node for selector: ' + data);
      markExecuting(obj, false);
    }
}
// Listen for messages from the popup.
const kEnableCopyCssText = '*{user-select: text !important;-webkit-user-select: text !important;-webkit-touch-callout: text !important;}';

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log('content script', msg);
  let action = msg.action;
  switch (action) {
    case 'detectElement':
      {
        if(!lastRightClickedElement) {
          console.error('no element right clicked');
          alert('没有获取到选中的元素,请使用工具栏里 Popup 菜单里创建。')
          return;
        }
        eventEmitter.emit(kEventKeyContextMenus);
      }
      break;
    case 'enableCopyText':
        {
          eventEmitter.emit(kEventKeyEnableCopy);
        }
        break;
    case 'exportText':
        {
          eventEmitter.emit(kEventKeyExportText);
        }
        break;
    case 'pickingElement':
        {
          eventEmitter.emit(kEventKeyPickingElement);
        }
        break;
    case 'getActiveRules':
      response(activeRules);
      break;
  
    default:
      break;
  }

});

let lastRightClickedElement = null;
function listenContextMenuShow() {
  console.log('Add contextmenu listener');
  document.body.addEventListener('contextmenu', function(ev) {
    lastRightClickedElement =  ev.target;
    console.log('interprite', lastRightClickedElement);
    return true;
  }, false);
}

let insertCSSHandler = async (onActionDone: (message: string)=> void) => {
  console.log('loadCache');
  const ruleList = await getRules(window.location.href);
  for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
    const obj: any = ruleList[idx2];
    let type = obj.type, data = obj.data;
    
    if(type == RuleActionType.insertCSS) {
      if(obj.disabled) {
        logRule(obj)
        console.log('obj.disabled');
        continue;
      }
      console.log('setStyle', obj);
      setStyle(data, obj.name);
      sendToPop(obj);// 记住执行过的规则
      onActionDone('已注入样式， 规则名 ：' + obj.name);
      logRule(obj);
    }
  }
};

let loadProcessHandler = async (onFinish: (message: string)=> void) => {
  console.log('loadProcessHandler');
  const ruleList = await getRules(window.location.href);
  for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
    const obj: any = ruleList[idx2];
    let type = obj.type, data = obj.data;
    if(type == RuleActionType.insertCSS) {
      continue;
    }
    if(obj.disabled) {
      logRule(obj);
      continue;
    }
    executeRule(obj, onFinish)
  }
};

async function getDefaultValue(key: string) {
  let on: any = await storage.get(kDBKeySettings);
  if(!on) {
    on = {};
    await storage.set(kDBKeySettings, on);
  }
  return on[key];
};

let bounce = -1;
let onElementAdded = async function (mutationsList, checkHandler) {
  let interval = await getDefaultValue('observeInterval');
  if(isNaN(interval)||interval < 1) {
    interval = 1;
  }
  for (let mutation of mutationsList) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if(bounce !== -1) {
        window.clearTimeout(bounce);
      }
      bounce = window.setTimeout(()=>{
        checkHandler();
        bounce = -1;
      }, interval * 1000);
    }
  }
};

// 这两个值用在 eventHanlder 或者 function 内，因为对应的 state value 当作 const 被捕获；
let pickPhase_ext = '';
let pickType_ext = '';
function Content() {
  console.log(document.readyState);
  const [pickPhase, setPickPhase] = useState('');
  const [pickType, setPickType] = useState('selector');
  const [tips, setTips] = useState(null);
  const [tipsOn, setTipsOn] = useState(true);

  const [selector, setSelector] = useState(null);
  const [ruleName, setRuleName] = useState('规则名称');
  const [ruleType, setRuleType] = useState(RuleActionType.autoHide);
  const [uiType, setUIType] = useState('');
  const [copyHTML, setCopyHTML] = useState('<p>内容为空</p>');

  const showTips = (msg) => {
    setTips(msg)
  }
  function onPickPhaseChange(phase: string) {
    pickPhase_ext = phase;
    setPickPhase(pickPhase_ext);
    if(phase === '') {
      hideHighlightFrame();
    }
  }
  const mouseOverHandler = (e)=>{
    // console.log(e.target, 'mouseenter');
    if(e.target.className.includes(highlightFrameClass)) {
      return true;
    }
    // 这里的 pickPhase  还是最开始闭包捕获的值
    if(pickPhase_ext == 'picking'){
      showHighlightFrame(e.target as Element);
      e.preventDefault();
      e.stopPropagation();
      return false;
    } else {
      return true;
    }
  }
  const mouseLeaveHandler = (e: Event)=>{
    // console.log(e.target, 'mouseLeaveHandler');
    // let elem = e.target as Element;
    // if(elem.className.includes(highlightFrameClass)) {
    //   return true;
    // }
    return true;
  }
  const clickHandler = (e: Event)=>{
    console.log(e.target, 'clickHandler');
    // 这里的 pickPhase  还是最开始闭包捕获的值
    if(pickPhase_ext === 'picking'){
      onPickPhaseChange('clicked');
      e.preventDefault();
      e.stopImmediatePropagation();
      
      if(pickType_ext == 'exporting') {
        const ele = e.target as HTMLElement;
        setUIType('copyable');
        setCopyHTML(ele.outerHTML);
      } else {
        lastRightClickedElement = e.target;
        eventEmitter.emit(kEventKeyContextMenus, '');
      }
      
      return false;
    } else {
      return true;
    }
  }

  useEffect(()=>{
    eventEmitter.add(kEventKeyContextMenus, ()=>{

      var selector = getSelector(lastRightClickedElement);
      if(selector) {
        setSelector(selector);
      }
      const titleName = document.title || '<no_title_page>';
      setRuleName(titleName);
      setUIType('panel');
    });
    eventEmitter.add(kEventKeyEnableCopy, ()=>{
      setRuleName('去掉不可复制的限制');
      setSelector(kEnableCopyCssText);
      setRuleType(RuleActionType.insertCSS);
      setUIType('panel');
    });
    
    let setupPickingEvent = ()=>{
      let doc = document.body;
      //
      if(!doc.getAttribute('ah-pickingEvent-attached')) {
        // 添加mouseenter事件，监听 click 事件，会触发元素本身的click事件，通常是点击后跳转或者展开
        let all = document.querySelectorAll('body *');
        all.forEach((e)=>{
          e.addEventListener('click', clickHandler, true);
        });
        document.body.addEventListener('mouseover', mouseOverHandler, false);
        document.body.addEventListener('mouseout', mouseLeaveHandler, false);
        doc.setAttribute('ah-pickingEvent-attached', 'true');
      }
    };
    eventEmitter.add(kEventKeyPickingElement, ()=>{
      pickType_ext = 'selector';
      setPickType(pickType_ext);

      onPickPhaseChange('picking');
      setUIType('picking');
      setupPickingEvent();
    });
    eventEmitter.add(kEventKeyExportText, ()=>{
      pickType_ext = 'exporting';
      setPickType(pickType_ext);
      setUIType('picking');
      onPickPhaseChange('picking');
      setupPickingEvent();
    });
    //
    listenContextMenuShow();
  },[]);

  useEffect(()=>{
    let init =async () => {
      let on: any = await storage.get(kDBKeySettings);
      if(!on) {
        on = {};
      }
      setTipsOn(on['tipsOn']);
    };
    init();
  },[]);

  useEffect(() => {
    // 植入内置的样式, 如按钮闪烁
    setStyle(builtinCSSInHost, 'builtinCSS');
    // 尽早的植入
    insertCSSHandler((msg)=>{
      showTips(msg);
    });

    let loadProcess = function(){
      loadProcessHandler((msg)=>{
        showTips(msg);
      });
    };
    // first attempt to hide\click
    loadProcess();
    // 2nd attempt to hide\click
    // add domChanging observer
    let observer = new MutationObserver(function(mutationsList) {
      onElementAdded(mutationsList, loadProcess);
    });
    observer.observe(document, { childList: true, subtree: true });
  }, []);

  // console.info(copyHTML);
  let UI = null;
  if(uiType == 'copyable') {
      UI = <Copyable innerHTML={copyHTML} onClose={()=>{
        onPickPhaseChange('');
        setUIType('');
      }} />
  } else if(uiType == 'picking') {
      UI = <div className="fixed p-2 flex flex-col items-center gap-1 justify-center w-screen bg-backgroundSecondary/75 text-primary ring-1 ring-offset-1 ring-blue-500">
      <div className=" text-center text-xl whitespace-nowrap">1，移动鼠标，选择需要操作的元素</div>
      <div className=" text-center text-xl whitespace-nowrap">2，左键点击元素,确认{pickType =='exporting'?'导出内容':'创建规则'}</div>
      <button className="btn-sm btn" onClick={()=>{
        onPickPhaseChange('');
        setUIType('');
      }}>取消</button>
    </div>;
  } else if (uiType == 'panel') {
    if(selector) {
      UI = <AddPanel selector={selector} ruleType={ruleType} ruleName={ruleName} onClose={()=>{
        lastRightClickedElement = null;
        if(pickPhase == 'clicked') {
          onPickPhaseChange('picking');
          setUIType('picking');
        } else {
          onPickPhaseChange('');
          setUIType('');
        }
      }} />
    } else {
      UI = <div>
        <span className="text-red-600">数据错误, 没有选中元素</span>
      </div>;
    }
  }
  if(tips && tipsOn) {
    const UI2 = <Warning key={'warning'} message={tips} autoHideCallback={() => {
      setTips('');
    }}></Warning>
    if(UI){
      return [UI, UI2];
    } else {
      return UI2;
    }
  }
  return UI;
}

function Warning({ message, autoHideCallback }: { message: string, autoHideCallback: Function }) {
  useEffect(() => {
    let init =async () => {
      let tipsHideDelay = await getDefaultValue('tipsHideDelay');
      if(isNaN(tipsHideDelay)) {
        tipsHideDelay = 2;
      }
      window.setTimeout(() => {
        autoHideCallback();
      }, tipsHideDelay * 1000);
    };
    
    init();
  }, []);
  return <div style={{
    borderColor: "red",
    borderWidth: 1,
    position: "fixed",
    whiteSpace:"nowrap",
    left:0,
    top:0,
    fontSize: 14,
    padding: 1
  }}>
    <span className="text-content2 alert-success">{message}</span>
  </div>
}

const highlightFrameClass = 'ah_highlight_frame';
const highlightSelector = '.' + highlightFrameClass;
let highlightLeftFrame = null, highlightTopFrame = null ,highlightRightFrame = null, highlightBottomFrame = null;
let highlightFrames = function() { 
  return [highlightLeftFrame, highlightTopFrame, highlightRightFrame, highlightBottomFrame]
};
const highlightTest = (e: Element)=>{
  try {
    showHighlightFrame(e);
    //
    highlightFrames().forEach((o)=>{
      o.className += ' ah_highlight_elem';
    });
    window.setTimeout(() => {
      highlightFrames().forEach((o)=>{
        o.className = o.className.replace('ah_highlight_elem', '');
      });
    }, 2000);
  } catch (error) {
    alert(error.message);
  }
};
function hideHighlightFrame(){
  if(highlightLeftFrame){
    highlightFrames().forEach((o)=>{
      o.style.display = 'none';
    });
  }
}

function showHighlightFrame(targetEle: Element){
  let topEle = document.querySelector(highlightSelector+'_top') as HTMLDivElement;
  const borderWidth = 2;
    if(!topEle) {
      console.info('没有找到该元素, create it first');
      document.body.insertAdjacentHTML('beforeend',`<div class="${highlightFrameClass +' '+ highlightFrameClass}_top" ></div>
      <div class="${highlightFrameClass +' '+ highlightFrameClass}_left" ></div>
      <div class="${highlightFrameClass +' '+ highlightFrameClass}_right" ></div>
      <div class="${highlightFrameClass +' '+ highlightFrameClass}_bottom" ></div>`);
      topEle = document.querySelector(highlightSelector+'_top') as HTMLDivElement;
    }
    highlightTopFrame = topEle;
    highlightLeftFrame = document.querySelector(highlightSelector+'_left') as HTMLDivElement;
    highlightBottomFrame = document.querySelector(highlightSelector+'_bottom') as HTMLDivElement;
    highlightRightFrame = document.querySelector(highlightSelector+'_right') as HTMLDivElement;
    // get position
    let target = targetEle.getBoundingClientRect();
    var X = target.left + document.documentElement.scrollLeft;
    var Y = target.top + document.documentElement.scrollTop;
    const w = target.width, h = target.height;
    highlightTopFrame.style.width = w + 'px';
    highlightTopFrame.style.height = borderWidth + 'px';
    highlightTopFrame.style.left = X + 'px';
    highlightTopFrame.style.top = Y + 'px';
    
    highlightLeftFrame.style.width = borderWidth + 'px';
    highlightLeftFrame.style.height = h + 'px';
    highlightLeftFrame.style.left = X + 'px';
    highlightLeftFrame.style.top = Y + 'px';

    highlightRightFrame.style.width = borderWidth + 'px';
    highlightRightFrame.style.height = h + 'px';
    highlightRightFrame.style.left = X + w + 'px';
    highlightRightFrame.style.top = Y + 'px';

    highlightBottomFrame.style.width = w + 'px';
    highlightBottomFrame.style.height = borderWidth + 'px';
    highlightBottomFrame.style.left = X + 'px';
    highlightBottomFrame.style.top = (Y + h) + 'px';

    highlightFrames().forEach((o)=>{
      o.style.display = 'block';
    });
}

function AddPanel({selector, ruleType, ruleName, onClose}:{selector: string, ruleType:RuleActionType, ruleName: string, onClose: Function}) {
  
  const [data, setData] = useState(selector);

  const location = document.location;
  let urlPrefix = location.host + location.pathname + '*';

  const [domain, setDomain] = useState(urlPrefix)
  const [type, setType] = useState(ruleType)
  const [name, setName] = useState(ruleName);

  const saveRule = async () => {
    let rule: IRuleAction = { type, name, data}
    rule.exampleUrl = document.location.href;
    let ruleJSON = await storage.get(kUniKey) || {};
    
    let ruleForDomain = ruleJSON[domain];
    if (!ruleForDomain) {
      ruleForDomain = [];
    }
    ruleForDomain.push(rule);
    ruleJSON[domain] = ruleForDomain;

    try {
      await storage.set(kUniKey, ruleJSON);
      alert('保存成功');
    } catch (error) {
      alert('出错了：' + error.message);
    }
  }

  const testRule = (e: FormEvent)=>{
    if(isMatched(domain, location.href)) {
      let rule: IRuleAction = {
        type: type,
        data: data,
        name: name,
        _domain: domain,
      }
      executeRule(rule, ()=>{});
      hideHighlightFrame();
    } else {
      alert('网页地址规则不匹配当前页面');
    }

    e.preventDefault();
    return false;
  };

  const [moved, setMoved] = useState({top: 0, left: 0});
  let lastX = 0,lastY = 0;
  const onMouseDown = (e: any) => {
    lastX = e.clientX,lastY = e.clientY;
    console.log('movedown client',e.clientX,e.clientY);

    const onMouseMove = (e: any) => {
      const moveX = e.clientX - lastX;
      const moveY = e.clientY - lastY;
      // console.log('client',e.clientX,e.clientY);
      // console.log('last',lastX,lastY);
      setMoved({top: moved.top + moveY, left: moved.left + moveX});
    }
    document.addEventListener('mousemove', onMouseMove);
    const onMouseUp = (e: any) => {
      // console.log(e.clientX, e.clientY);
      // lastX = 0,lastY = 0;
      document.removeEventListener('mousemove', onMouseMove);
    }
    document.addEventListener('mouseup', onMouseUp);
  };

  return <div style={moved}
    className="cl-s rounded-sm bg-backgroundPrimary w-96 p-4 fixed ring-2 ring-offset-2 ring-blue-500">
      <div className="cursor-move text-sm text-center select-none opacity-75 divider divider-horizontal mt-0" onMouseDown={onMouseDown}>按住拖动浮层</div>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        <div className="flex flex-row items-center gap-1 tooltip tooltip-top" data-tooltip="以下生成规则大部分情况下不需要修改，除非你懂 HTML/CSS">
          <h1 className="text-base font-semibold ">手动添加规则（beta）</h1>
          <FaQuestionCircle />
        </div>
        <form className="form-group" onSubmit={saveRule}>
          <div className="form-field">
            <label className="form-label">网页地址规则 <span className="text-sm form-label-alt text-indigo-600">小心修改</span></label>
            <div className="tooltip tooltip-top" data-tooltip="如，example.com/path* ， *.example.com/path, file.exmaple.com">
              <input className="input input-solid max-w-full" placeholder="输入网页地址规则" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="message">匹配的选择器 (以及规则）<span className=" text-orange-600">谨慎修改</span></label>
            <div className="tooltip tooltip-top" data-tooltip="支持 CSS 3 选择器 和自定义 :contains('目标内容'）选择器">
              <input className="input input-solid max-w-full" id="message" placeholder="输入样式规则，可参考下方预览里内容" required onChange={(e) => setData(e.target.value)} value={data} />
            </div>
            <button className="btn-sm btn-solid-warning" onClick={(e)=>{
              try {
                highlightTest(document.querySelector(data))
              } catch (error) {
                alert(error.message);
              }
              e.preventDefault();
              return false;
            }}>测试选择器</button>
          </div>
          <div className="form-field">
            <label className="form-label">类型</label>
            <div className="form-control">
              <select className="select max-w-full" defaultValue={type} onChange={(e) => setType(e.target.value as RuleActionType)}>
                <option value={RuleActionType.autoHide}>自动隐藏元素</option>
                <option value={RuleActionType.autoClick}>自动点击元素</option>
                <option value={RuleActionType.autoNavigate}>自动跳转元素</option>
                <option value={RuleActionType.insertCSS}>注入样式</option>
              </select>
            </div>
            <button className="btn-sm btn-solid-warning" onClick={testRule}>测试规则是否生效</button>
          </div>
          <div className="form-field">
            <label className="form-label">规则名称 <span className="text-green-700">建议修改</span></label>
            <div className="tooltip tooltip-top" data-tooltip="设置为容易记忆的名称">
              <input className="input input-solid max-w-full" id="name" placeholder="输入对样式规则对描述，便于区别" required onChange={(e) => setName(e.target.value)} value={name} />
            </div>
          </div>
          <div className="form-field">
            <div className="form-control justify-between items-center">
              <button type="submit" className="rounded-lg btn btn-primary">保存</button>
              <button className="btn" onClick={(e)=>{
                onClose(); 
                e.preventDefault();
                return false;
              }}>取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>;
}

function Copyable({innerHTML, onClose}:{innerHTML: string, onClose: () => void}) {
  return <div className="h-screen w-screen fixed">
      <div id="mask" className="opacity-75 bg-slate-400 w-full h-full absolute">
      </div>
      <div className="w-full h-full rounded absolute">
          <div className="m-auto w-3/5 p-4 bg-white relative max-h-full overflow-scroll">
              <div className="absolute top-4 right-4 text-primary">
                  <button className="btn btn-outline-primary" onClick={onClose}>关闭浮层</button>
              </div>
              <h1 className="text-2xl font-bold mb-4 text-primary">复制以下内容</h1>
              <div className="border-indigo-500/75 border-dashed border-2 rounded p-4" dangerouslySetInnerHTML={{ __html: innerHTML }}></div>
          </div>
      </div>
  </div>
}
export default Content