
export const builtinRule = {
  "*.zhihu.com": [
    {
      "type": "autoClick",
      "data": ".Modal-closeButton"
    }
  ],
  "blog.csdn.net": [
    {
      "type": "autoHide",
      "data": ".passport-login-container"
    },
    {
      "type": "insertCSS",
      "data": ".passport-container-mini {display: none !important;} #content_views pre code{user-select: text !important;} #content_views pre{ user-select: text !important;}"
    }
  ],
  "www.jianshu.com/go-wild*": [
    {
      "type": "autoClick",
      "data": ":contains('继续前往')"
    }
  ],
  "link.zhihu.com/":[
  {
    "type": "autoClick",
    "data": ".content .link"
  }]
} 