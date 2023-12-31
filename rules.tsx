import { Storage } from "@plasmohq/storage";

export enum RuleActionType {
  autoClick = "autoClick",
  autoHide = "autoHide",
  insertCSS = "insertCSS",
  autoNavigate = "autoNavigate",
  other = "other",
}
export interface IRuleAction {
  type: RuleActionType,
  name: string,
  data: string,
  disabled?: boolean,
  _domain?: string, // 冗余 IRule 对象里的 key 值，用于 disabled rule 的定位
  exampleUrl?: string // 使用工具生成是记住操作的地址；
}
export interface IRule {
  [key: string]: Array<IRuleAction>
}

export const builtinCSSInHost = `
@keyframes ah_blink {
  0% { opacity: 0.3; outline-color: red; }
  50% { opacity: 1; outline-color: green; }
  100% { opacity: 0.3;outline-color: red; }
}

.ah_highlight_elem {
  animation: ah_blink 1s linear;
}
.ah_highlight_frame {
  outline: red solid 2px;
  outline-offset: -2px;
}
`


export const builtinRule: IRule = {
  "*.zhihu.com": [
    {
      "type": RuleActionType.autoClick,
      "name": "Close login dialogue",
      "data": ".Modal-closeButton"
    }
  ],
  "blog.csdn.net": [
    {
      "type": RuleActionType.autoHide,
      "name": "Close passport-login",
      "data": ".passport-login-container"
    },
    {
      "type": RuleActionType.insertCSS,
      "name": "Remove restriction for copy",
      "data": ".passport-container-mini {display: none !important;} #content_views pre code{user-select: text !important;} #content_views pre{ user-select: text !important;}"
    }
  ],
  "www.jianshu.com/go-wild*": [
    {
      "type": RuleActionType.autoClick,
      "name": "ignore the warning for target page",
      "data": ":contains('继续前往')"
    }
  ],
  "link.zhihu.com/":[
  {
    "type": RuleActionType.autoClick,
    "name": "Auto open the external page",
    "data": ".content .link"
  }]
} 


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

const storage = new Storage();
const kUniKey = 'KeyOfRuleForDomains';
const kRemoteRule = 'kRemoteRuleForDomains';
const kDisabledRule = 'kDisabledRule';

export async function disableRules(rule: IRuleAction) {
  let disabled: any = await storage.get(kDisabledRule);
  if(!disabled) {
    disabled = {};
  }
  // trim query objects
  let domain = rule._domain;
  if(domain) {
    if(rule.disabled) {
      disabled[domain] =  rule;
    } else {
      let succ = delete disabled[domain];
      console.log('Remove rule from list, succ = ' + succ);
    }
    await storage.set(kDisabledRule, disabled);
  } else {
    console.error('legacy data', rule);
  }
}

// generate selector from dom hierarchy
export function getSelector(_target: Element): string {
  if(!_target) {
    console.error('pass nonnull element');
    return;
  }

  let classList: string[] = [];
  let stop = false;
  while(!stop && _target) {
    let clsName: any = _target.className;
    if(clsName && typeof clsName === 'object') {
      // for svg/path
      _target = _target.parentElement;
      continue;
    }
    if(_target == document.body) {
      classList.push('body');
      stop = true;
    } else if(_target.id) {
      classList.push(`#${_target.id}`);
      stop = true;
    } else {
      let classNameList = clsName.split(' ').filter((o)=>{return o && o.length > 0});// replace(' ', '.')
      if(classNameList.length > 0) {
        if(classNameList.length > 2) {
          classNameList.length = 2;
        }
        classList.push('.' + classNameList.join('.'));
      } else {
        // 不存在 id，也不存在 class
        classList.push(_target.tagName.toLowerCase());
      }
      _target = _target.parentElement;
    }
  }
  // classList 过长影响 querySelector 的执行（报错）
  // 保留第一个，重要
  if(classList.length > 4) {
    // 清洗  tagName
    classList = classList.filter((o, idx)=>{
      if(idx == 0)
        return true;
      return o && (o.startsWith('.') || o.startsWith('#'));
    });
  }
  // 还大于 4
  if(classList.length > 4){

  }
  return classList.reverse().join(' ');
}

async function getAllRules() {
  // 合并自定义和订阅
  // 相同的 key 以后面的规则为准
  let rules: IRule = {};
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
  let customRules: IRule = await storage.get(kUniKey);
  rules = Object.assign(rules, customRules);
  return rules;
}

async function isRuleIgnored(domain: string, activeRule: IRuleAction): Promise<boolean> {
  let rules: any = await storage.get(kDisabledRule);
  for(const shortUrl in rules) {
    if(domain == shortUrl) {
      let disabledItem = rules[shortUrl];
      if(activeRule.data == disabledItem.data && activeRule.type == disabledItem.type && activeRule.name == disabledItem.name) {
        return true;
      }
    }
  }
  return false;
}

export async function getRules(href: string) {
  // 合并自定义和订阅规则
  // 相同的 key 以后面的规则为准
  let rules: IRule = await getAllRules();

  let matchedRules = [];
  for (const domain in rules) {
    if (Object.prototype.hasOwnProperty.call(rules), domain) {
      const ruleList = rules[domain];
      if(!isMatched(domain, href)){
        continue;
      }
      for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
        const obj = ruleList[idx2];
        obj.disabled = await isRuleIgnored(domain, obj);
        if(obj.disabled) {
          console.log('ignore disabled rule', obj);
        }
        // 复制是为了 disabled 状态管理
        obj._domain = domain;
        matchedRules.push(obj);
      }
    }
  }
  return matchedRules;
}

