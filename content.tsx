import { useEffect, useState } from "react";
import eventEmitter, { EventEmitter} from "~EventEmitter";
import { getRules } from "~rules";

// 生成文本
import styleText from "data-text:./style.module.css"
// import type { PlasmoCSConfig } from "plasmo"
 
// 生成编译期间对象
import * as S from "./style.module.css"
 // injectAnchor 的时候会注入 样式文件
export const getStyle = () => {
  console.log('sgette');
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const kEventKeyContextMenus = 'kEventKeyContextMenus';
// const eventEmitter = new EventEmitter();

const setStyle = (styleText, num) => {
  const style = document.createElement("style")
  style.textContent = styleText
  style.type = "text/css";
  style.id = 'ah_style_' + num;
  style.setAttribute('data-name', 'access-happily');
  document.head.appendChild(style);
}

const activeRules = [];
function logRule(_rule) {
  activeRules.push(_rule);
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
// generate selector from dom hierarchy
function getSelector(_target: Element): string {
  if(!_target) throw new Error('pass nonnull element');

  let classList: string[] = [];
  let stop = false;
  while(!stop && _target) {
    if(_target == document.body) {
      classList.push('body');
      stop = true;
    } else if(_target.id) {
      classList.push(`#${_target.id}`);
      stop = true;
    } else {
      if(_target.className) {
        let classNameList = _target.className.split(' ');
        classList.push('.' + classNameList[0]);
      }
      _target = _target.parentElement;
    }
  }
  return classList.reverse().join(' ');
}
// Listen for messages from the popup.
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


function Content() {
  console.log(document.readyState);
  const [hidden, setHidden] = useState(false);
  const [tips, setTips] = useState('已自动隐藏登录提示弹窗');

  const [showPanel, setShowPanel] = useState(true);

  const showTips = (msg) => {
    setHidden(true);
    setTips(msg)
  }

  useEffect(()=>{
    eventEmitter.add(kEventKeyContextMenus, ()=>{
      setShowPanel(true);
    });
  },[]);

  useEffect(() => {
    let loadCache = async () => {
      const ruleList = await getRules(window.location.href);
      for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
        const obj: any = ruleList[idx2];
        
        if(obj.disabled) {
          logRule(obj)
          continue;
        }
        let type = obj.type, data = obj.data;
        if (type == 'insertCSS') {
          setStyle(data, obj.name);
          showTips('已注入样式');
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

        if (element) {
          if (type == 'autoHide') {
            element.style = 'display:none !important';
            showTips('已自动隐藏登录提示弹窗')
          } else if (type == 'autoNavigate') {
            let link = element.value || element.innerText;
            showTips('已自动跳转到页面 ' + link);
            window.setTimeout(() => {
              window.location.assign(link);
            }, 1000);
          } else {
            showTips('已自动点击元素')
            window.setTimeout(() => {
              element.click();
            }, 1000);
          }
          //
          sendToPop(obj);
          logRule(obj);
        } else {
          console.info('Not found target node for selector: ' + data);
        }
      }
    };
    if (document.readyState == 'complete') {
      loadCache();
    } else {
      window.addEventListener('load', () => {
        loadCache();
        listenContextMenuShow();
      });
    }
  }, []);

  let UI = <span />;
  if (showPanel) {
    UI = <AddPanel onClose={()=>{
      setShowPanel(false);
    }} />
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
    width: "100%"
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

function AddPanel({onClose}:{onClose: Function}) {
  var selector = '2';//getSelector(lastRightClickedElement);
  lastRightClickedElement = null;
  if(selector) {
    return <div className={S.add_panel}>
      add me {selector}
      <button className="btn">Default</button>
    </div>
  } else {
    return <div>
      数据错误
    </div>
  }
}

export default Content