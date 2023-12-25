import { useEffect, useState, type FormEvent } from "react";
import eventEmitter, { EventEmitter} from "~EventEmitter";
import { builtinCSSInHost, getRules, getSelector, isMatched, type IRuleAction } from "~rules";

import { RuleActionType, builtinRule } from "~rules";
// 这里很关键：引入基础样式，否则按钮没有背景色（rippleUI）
import "./standalone.css";


import { Storage } from "@plasmohq/storage"
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';
const kDBKeySettings = 'kDBKeySettings';
// 生成文本
import styleText from "data-text:./standalone.css";
import type { PlasmoGetStyle } from "plasmo";
  // injectAnchor 的时候会注入 样式文件
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  // https://github.com/PlasmoHQ/plasmo/issues/835
  style.textContent = styleText;
  console.log(styleText);
  return style
}

const kEventKeyContextMenus = 'kEventKeyContextMenus';
const kEventKeyEnableCopy = 'kEventKeyEnableCopy';
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

function executeRule(obj: IRuleAction, onFinish: (message: string)=> void) {
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
          e.style = 'display:none !important';
        });
        onFinish('已自动隐藏元素， 规则名 ：' + obj.name);
        markExecuting(obj, false);
      } else if (type == RuleActionType.autoNavigate) {
        let firstOne = elements[0];
        let link = firstOne.value || firstOne.innerText;
        window.setTimeout(() => {
          window.location.assign(link);
          onFinish('已自动跳转到页面 ' + link + '， 规则名 ：' + obj.name);
          markExecuting(obj, false);
        }, 1000);
      } else {
        window.setTimeout(() => {
          elements.forEach((e)=>{
            e.click();
          });
          onFinish('已自动点击元素， 规则名 ：' + obj.name);
          markExecuting(obj, false);
        }, 1000);
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
          alert('没有获取到选中的元素,请更换右键位置再次尝试.')
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
    case 'getActiveRules':
      response(activeRules);
      break;
  
    default:
      break;
  }

});

let lastRightClickedElement = null;
function listenContextMenuShow() {
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
  //
  listenContextMenuShow();
};

let bounce = -1;
let onElementAdded = function (mutationsList, checkHandler) {
  for (let mutation of mutationsList) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if(bounce !== -1) {
        window.clearTimeout(bounce);
      }
      bounce = window.setTimeout(()=>{
        checkHandler();
        bounce = -1;
      }, 1500);
    }
  }
};

function Content() {
  console.log(document.readyState);
  const [hidden, setHidden] = useState(false);
  const [tips, setTips] = useState('已自动隐藏登录提示弹窗');
  const [tipsOn, setTipsOn]  = useState(true);

  const [selector, setSelector] = useState(null);
  const [ruleName, setRuleName] = useState('规则名称');
  const [ruleType, setRuleType] = useState(RuleActionType.autoHide);
  const [showPanel, setShowPanel] = useState(false);

  const showTips = (msg) => {
    setHidden(true);
    setTips(msg)
  }

  useEffect(()=>{
    eventEmitter.add(kEventKeyContextMenus, ()=>{
      setShowPanel(false);

      var selector = getSelector(lastRightClickedElement);
      if(selector) {
        setSelector(selector);
        lastRightClickedElement = null;
      }
      const titleName = document.title || '<no_title_page>';
      setRuleName(titleName);
      setShowPanel(true);
    });
    eventEmitter.add(kEventKeyEnableCopy, ()=>{
      setShowPanel(false);

      setRuleName('去掉不可复制的限制');
      setSelector(kEnableCopyCssText);
      setRuleType(RuleActionType.insertCSS);
      setShowPanel(true);
    });
    //
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

  let UI = <span />;
  if (showPanel) {
    if(selector) {
      UI = <AddPanel selector={selector} ruleType={ruleType} ruleName={ruleName} onClose={()=>{
        setShowPanel(false);
      }} />
    } else {
      UI = <div>
        <span className="text-red-600">数据错误, 没有选中元素</span>
      </div>;
    }
  } else if (hidden && tipsOn) {
    UI = <Warning message={tips} autoHideCallback={() => {
      setHidden(false);
    }}></Warning>
  }
  return UI;
}

function Warning({ message, autoHideCallback }: { message: string, autoHideCallback: Function }) {
  useEffect(() => {
    window.setTimeout(() => {
      autoHideCallback();
    }, 4000);
  }, []);
  return <div style={{
    backgroundColor: "red",
    position: "fixed",
    minWidth:200,
    left:0,
    top:0,
    fontSize: 14,
    padding: 1
  }}>
    <span className="text-content2 alert-success">{message}</span>
  </div>
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

  // 确保弹窗的 root fontSize 不受影响
  // useEffect(()=>{
  //   let root = document.querySelector('html');
  //   let orig = window.getComputedStyle(root).getPropertyValue('font-size');
  //   if(orig != '16px' && orig != '62.5%') {
  //     root.style['font-size'] =  '16px';
  //   }
  //   return ()=>{
  //     if(orig != '16px') {
  //       root.style['font-size'] =  orig;
  //     }
  //   }
  // },[]);

  const highlightTest = (e: FormEvent)=>{
    let ele = document.querySelector(data);
    if(!ele) {
      alert('没有找到该元素');
    } else {
      ele.className = ele.className + ' ah_highlight_elem';
    }
    window.setTimeout(()=>{
      ele.className = ele.className.replace(' ah_highlight_elem', '');
    },1000);
    e.preventDefault();
    return false;
  };
  const testRule = (e: FormEvent)=>{
    if(isMatched(domain, location.href)) {
      let rule: IRuleAction = {
        type: type,
        data: data,
        name: name,
        _domain: domain,
      }
      executeRule(rule, ()=>{});
    } else {
      alert('网页地址规则不匹配当前页面');
    }

    e.preventDefault();
    return false;
  };

  return <div className="cl-s rounded-sm bg-backgroundPrimary w-96 p-4 fixed ring-2 ring-offset-2 ring-blue-500">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-primary">手动添加规则 （beta）</h1>
          <p className="text-xs text-yellow-600">以下生成规则大部分情况下不需要修改，除非你懂 HTML/CSS</p>
        </div>
        <form className="form-group" onSubmit={saveRule}>
          <div className="form-field">
            <label className="form-label">网页地址规则 <span className="text-sm form-label-alt text-indigo-600">小心修改</span></label>
            <input className="input input-solid max-w-full" placeholder="输入网页地址规则" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
            <label className="form-label">
              <span className=" form-label-alt">如，example.com/path* , *.example.com/path, file.exmaple.com</span>
            </label>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="message">匹配的选择器 (以及规则）<span className=" text-orange-600">谨慎修改</span></label>
            <input className="input input-solid max-w-full" id="message" placeholder="输入样式规则，可参考下方预览里内容" required onChange={(e) => setData(e.target.value)} value={data} />
            <button className="btn-sm btn-solid-warning" onClick={highlightTest}>测试选择器</button><span className="form-label-alt">选中元素会边框变色闪烁(部分背景下不明显)</span>
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
            <input className="input input-solid max-w-full" id="name" placeholder="输入对样式规则对描述，便于区别" required onChange={(e) => setName(e.target.value)} value={name} />
            <label className="form-label">
              <span className="form-label-alt">设置为容易记忆的名称</span>
            </label>
          </div>
          <div className="form-field">
            <div className="form-control justify-between items-center">
              <button type="submit" className="rounded-lg btn btn-primary">保存</button>
              <button className="btn" onClick={()=>{
                onClose();
              }}>放弃</button>
            </div>
          </div>
        </form>
      </div>
    </div>;
}

export default Content