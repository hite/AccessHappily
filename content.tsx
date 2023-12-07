import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"

const setStyle = (styleText) => {
    const style = document.createElement("style")
    style.textContent = styleText
    style.type = "text/css";
    style['data-name'] = 'access-happily';
    document.head.appendChild(style);
  }

const storage = new Storage();
const uniKey = 'KeyOfRuleForDomains';


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
  var textNodes = [];

  while(node = walker.nextNode()) {
    let value = node.nodeValue.trim();
    if (value == targetContent) {
      return node;
      break;
    }
  }
  return null;
}
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
      let rules: any = await storage.get(uniKey);
      for (const key in rules) {
        if (Object.prototype.hasOwnProperty.call(rules), key) {
          const ruleList = rules[key];
          if(isMatched(key, window.location.href)){
            for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
              const obj : any = ruleList[idx2];
              let type = obj.type, data = obj.data;

              if(type == 'insertCSS') {
                setStyle(data);
                showTips('已注入样式')
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
                } else {
                  showTips('已自动点击元素')
                  window.setTimeout(()=>{
                    element.click();
                  }, 1000);
                }
              } else {
                console.error('Not found target node for selector: ' + data);
              }
            }
          }
        }
      }
      
      if(hidden) {
        window.setTimeout(()=>{
          setHidden(false);
        },2000);
      }
    }
    if(document.readyState == 'complete') {
      loadCache();
    } else {
      window.addEventListener('load', ()=>{
        console.log('loadCache')
        loadCache();
        console.log('loadCache2')
      });
    }
  }, [])
 
  if (hidden) {
    return (<p
    style={{
      color:'darkgreen'
    }}
    >{tips}</p>)
  } else {
    return <span/>;
  }
}

export default Content