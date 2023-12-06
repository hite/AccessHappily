import { useEffect, useState } from "react"
import styleText from 'data-text:./content.scss';
import type { PlasmoGetStyle } from "plasmo";
import { Storage } from "@plasmohq/storage"

const setStyle = (styleText) => {
    const style = document.createElement("style")
    style.textContent = styleText
    style.type = "text/css";
    style['data-name'] = 'access-happily';
    document.head.appendChild(style);
  }

 export const builtinRule = {
  'zhihu.com': [{
    type:'autoHide',
    data: '.Modal-enter-done'
  }],
  '.csdn.net': [{
    type:'autoHide',
    data: '.passport-login-container'
  },
  {
    type:'insertCSS',
    data: '.passport-container-mini {display: none !important;}'
  }
]
 } 

const storage = new Storage();
const uniKey = 'KeyOfRuleForDomains';
function Content() {

  console.log(document.readyState);
  const [hidden, setHidden] = useState(false);
  let host = location.host;

  useEffect(()=>{
    let loadCache =async () => {
      let allCustomRules = await storage.get(uniKey);
      let rules = Object.assign(allCustomRules, builtinRule);
      for (const key in rules) {
        if (Object.prototype.hasOwnProperty.call(rules), key) {
          const ruleList = rules[key];
          if(host.endsWith(key)){
            for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
              const obj : any = ruleList[idx2];
              let type = obj.type, data = obj.data;

              if(type == 'insertCSS') {
                setStyle(data);
                continue;
              }
              let element = document.querySelector(data);
              if (element) {
                if (type == 'autoHide') {
                  element.style = 'display:none !important'
                } else {
                  element.click();
                }
                setHidden(true)
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
    window.addEventListener('load', ()=>{
      loadCache();
    });
  }, [])
 
  if (hidden) {
    return (<p
    style={{
      color:'yellowgreen'
    }}
    >已自动隐藏登录提示弹窗</p>)
  } else {
    return <span/>;
  }
}

export default Content