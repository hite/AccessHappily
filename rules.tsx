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
  disabled?: boolean
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

export async function getAllRules(href?: string, ignoreDisabled: boolean = false) {
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
      if (!location) {
        return rules;
      }

      let matchedRules = [];
      for (const key in rules) {
        if (Object.prototype.hasOwnProperty.call(rules), key) {
          const ruleList = rules[key];
          if(!isMatched(key, href)){
            continue;
          }
          for (let idx2 = 0; idx2 < ruleList.length; idx2++) {
            const obj : any = ruleList[idx2];
            if(obj.disabled && !ignoreDisabled) {
              console.log('ignore rule', obj);
              continue;
            }

            matchedRules.push(obj);
          }
        }
      }
      return matchedRules;
}