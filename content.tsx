import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";

const setStyle = (styleText, num) => {
    const style = document.createElement("style")
    style.textContent = styleText
    style.type = "text/css";
    style.id = 'ah_style_' + num;
    style.setAttribute('data-name','access-happily');
    document.head.appendChild(style);
}

const activeRules = [];
function logRule(_rule) {
  activeRules.push(_rule);
}

const storage = new Storage();
const kUniKey = 'KeyOfRuleForDomains';
const kRemoteRule = 'kRemoteRuleForDomains';

export function isMatched(domain: string, href: string): boolean {
  let location = new URL(href);
  let url = location.host + location.pathname;

  let hasPrefix = domain.startsWith('*'), hasSuffix = domain.endsWith('*');
  if (hasPrefix || hasSuffix) {
     domain = domain.replaceAll('*', '');
     if(hasPrefix && hasPrefix) {
      return url.indexOf(domain) > -1;
     } else if(hasPrefix) {
      return url.endsWith(domain);
     } else {
      return url.startsWith(domain);
     }
  } else {
    return location.host == domain;
  }
}

function nativeTreeWalker(targetContent) {
  var walker = document.createTreeWalker(
      document.body, 
      NodeFilter.SHOW_TEXT, 
      null
  );

  var node;

  while(node = walker.nextNode()) {
    let value = node.nodeValue.trim();
    if (value == targetContent) {
      return node;
      break;
    }
  }
  return null;
}

function sendToPop(_data){
  // send message to popup
  chrome.runtime.sendMessage(_data);
}

// Listen for messages from the popup.
chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log('content script', msg, response);
  let action = msg.action;
  if(action == 'getActiveRules') {
    response(activeRules);
  }
});

function Content() {

  console.log(document.readyState);
  const [hidden, setHidden] = useState(false);
  const [tips, setTips] = useState('已自动隐藏登录提示弹窗');

  const showTips = (msg) =>{
    setHidden(true);
    setTips(msg)
  }

  useEffect(()=>{
    let loadCache = async () => {
      // 合并自定义和订阅
      // 相同的 key 以后面的规则为准
      let rules: any = [];
      let rulesInSubscription: any = await storage.get(kRemoteRule);
      if(rulesInSubscription) {
        for (let idx = 0; idx < rulesInSubscription.length; idx++) {
          const sub = rulesInSubscription[idx];
          if(sub.enabled) {
            rules = Object.assign(rules, sub.content);
          }
        }
      }
      // 自定义优先级更高
      let customRules: any = await storage.get(kUniKey);
      rules = Object.assign(rules, customRules);
      
      for (const key in rules) {
        if (Object.prototype.hasOwnProperty.call(rules), key) {
          const ruleList = rules[key];
          if(!isMatched(key, window.location.href)){
            continue;
          }
          for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
            const obj : any = ruleList[idx2];
            let type = obj.type, data = obj.data;

            if(type == 'insertCSS') {
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
               
               if(textNode) {
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
                window.setTimeout(()=>{
                  window.location.assign(link);
                }, 1000);
              } else {
                showTips('已自动点击元素')
                window.setTimeout(()=>{
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
        }
      }
    }

    if(document.readyState == 'complete') {
      loadCache();
    } else {
      window.addEventListener('load', ()=>{
        loadCache();
      });
    }
  }, []);
 
  if (hidden) {
    return <Warning message={tips} autoHideCallback={()=>{
      setHidden(false);
    }}></Warning>
  } else {
    return <span/>;
  }
}

function Warning({message, autoHideCallback}: {message: string, autoHideCallback:Function}) {
  useEffect(()=>{
    window.setTimeout(()=>{
      autoHideCallback();
    },4000);
  },[]);
  return <div style={{
    backgroundColor: "yellow",
    width: "100%"
  }}>
	<div style={{
    display:"flex",
    flexDirection:"column",
    fontSize: 14
  }}>
		<span className="text-content2 alert-success">{message}</span>
	</div>
</div>
}

export default Content