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