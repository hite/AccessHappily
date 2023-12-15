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
  exampleUrl?: string // 使用工具生成是记住操作的地址；
}
export interface IRule {
  [key: string]: Array<IRuleAction>
}
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

export async function disableRules(url: string, rule: IRuleAction) {
  let disabled: any = await storage.get(kDisabledRule);
  if(!disabled) {
    disabled = {};
  }
  // trim query objects
  let newUrl = url.split('?')[0];
  disabled[newUrl] =  rule;
  await storage.set(kDisabledRule, disabled);
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
        classList.push('.' + classNameList.join('.'));
      }
      _target = _target.parentElement;
    }
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
    if(isMatched(domain, shortUrl)) {
      let disabledItem = rules[shortUrl];
      if(activeRule.data == disabledItem.data && activeRule.type == disabledItem.type && activeRule.name == disabledItem.name) {
        return true;
      }
    }
  }
  return false;
}

export async function getRules(href: string) {
  // 合并自定义和订阅
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

        matchedRules.push(obj);
      }
    }
  }
  return matchedRules;
}

