import { useEffect, useState } from "react";
import eventEmitter, { EventEmitter} from "~EventEmitter";
import { getRules, getSelector, type IRuleAction } from "~rules";

import { RuleActionType, builtinRule } from "~rules";
// 这里很关键：引入基础样式，否则按钮没有背景色（rippleUI）
import "./style.css";


import { Storage } from "@plasmohq/storage"
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';

// 生成文本
import styleText from "data-text:./style.css"
import type { PlasmoGetStyle } from "plasmo"
  // injectAnchor 的时候会注入 样式文件
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
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
      break;
    }
  }
  return null;
}

function sendToPop(_data) {
  // send message to popup
  chrome.runtime.sendMessage(_data);
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

let loadProcessHandler = async (onActionDone: (message: string)=> void) => {
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

    let element = null;
    if (data.startsWith(':contains(')) {
      // :contains('继续前往')
      let rawContent = data.replace(':contains(', '');
      let targetContent = rawContent.substring(1, rawContent.length - 2);
      let textNode = nativeTreeWalker(targetContent);

      if (textNode) {
        element = textNode.parentNode;
      }
    } else {
      element = document.querySelector(data);
    }

    if (element && !element.ac_processing) {
      element.ac_processing = true;
      if (type ==  RuleActionType.autoHide) {
        element.style = 'display:none !important';
        onActionDone('已自动隐藏登录提示弹窗， 规则名 ：' + obj.name)
        element.ac_processing = false;
      } else if (type == RuleActionType.autoNavigate) {
        let link = element.value || element.innerText;
        onActionDone('已自动跳转到页面 ' + link + '， 规则名 ：' + obj.name);
        window.setTimeout(() => {
          window.location.assign(link);
          element.ac_processing = false;
        }, 1000);
      } else {
        onActionDone('已自动点击元素， 规则名 ：' + obj.name)
        window.setTimeout(() => {
          element.click();
          element.ac_processing = false;
        }, 1000);
      }
      //
      sendToPop(obj);
      logRule(obj);
    } else if (element && element.ac_processing) {
      console.info('the element is processing: ', element);
    } else {
      console.info('Not found target node for selector: ' + data);
    }
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
      setRuleName('去掉不可复制的限制');
      setSelector(kEnableCopyCssText);
      setRuleType(RuleActionType.insertCSS);
      setShowPanel(true);
    });
  },[]);

  useEffect(() => {
    // 尽早的植入
    insertCSSHandler((msg)=>{
      showTips(msg);
    });

    let executeRule = function(){
      loadProcessHandler((msg)=>{
        showTips(msg);
      });
    };
    // first attempt to hide\click
    executeRule();
    // 2nd attempt to hide\click
    // add domChanging observer
    let observer = new MutationObserver(function(mutationsList) {
      onElementAdded(mutationsList, executeRule);
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
  } else if (hidden) {
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
    backgroundColor: "yellow",
    position: "fixed",
    minWidth:400,
    left:0,
    top:0
  }}>
    <div style={{
      display: "flex",
      flexDirection: "column",
      fontSize: 14
    }}>
      <span className="text-content2 alert-success">{message}</span>
    </div>
  </div>
}

function AddPanel({selector, ruleType, ruleName, onClose}:{selector: string, ruleType:RuleActionType, ruleName: string, onClose: Function}) {
  
  const [data, setData] = useState(selector);

  const location = document.location;
  let urlPrefix = location.host + location.pathname + '/*';

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

  return <div className="cl-s bg-backgroundPrimary w-96 p-4 fixed">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">手动添加规则 （beta）</h1>
          <p className="text-xs text-yellow-600">以下生成规则大部分情况下不需要修改，除非你懂 HTML</p>
        </div>
        <form className="form-group" onSubmit={saveRule}>
          <div className="form-field">
            <label className="form-label">网页地址规则</label>
            <input className="input input-solid " placeholder="输入网页地址规则" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
            <label className="form-label">
              <span className="text-sm form-label-alt text-indigo-600">小心修改，  如，example.com/path* , *.example.com/path, file.exmaple.com</span>
            </label>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="message">匹配的选择器 (以及规则）</label>
            <input className="input input-solid max-w-full" id="message" placeholder="输入样式规则，可参考下方预览里内容" required onChange={(e) => setData(e.target.value)} value={data} />
            <label className="form-label">
              <span className="form-label-alt text-orange-600">谨慎修改</span>
            </label>
          </div>
          <div className="form-field">
            <label className="form-label">类型</label>
            <div className="form-control">
              <select className="select" defaultValue={type} onChange={(e) => setType(e.target.value as RuleActionType)}>
                <option value={RuleActionType.autoHide}>自动隐藏元素</option>
                <option value={RuleActionType.autoClick}>自动点击元素</option>
                <option value={RuleActionType.autoNavigate}>自动跳转元素</option>
                <option value={RuleActionType.insertCSS}>注入样式</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">规则名称</label>
            <input className="input input-solid" id="name" placeholder="输入对样式规则对描述，便于区别" required onChange={(e) => setName(e.target.value)} value={name} />
            <label className="form-label">
              <span className="form-label-alt text-green-700">建议修改，设置为容易记忆的名称</span>
            </label>
          </div>
          <div className="form-field">
            <div className="form-control justify-between">
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