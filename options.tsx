import { useEffect, useState } from "react";
import { createContext, useContext } from 'react';
import { RuleActionType, builtinRule } from "~rules";
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaQuestionCircle } from "react-icons/fa";
import { FaSlideshare } from "react-icons/fa";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { GrDocumentTest } from "react-icons/gr";
import "./style.css";

import VanillaJSONEditor from "./VanillaJSONEditor";
import Settings from "~Settings";

import { Storage } from "@plasmohq/storage"
import Suscription from "~Subscription";
import PlayGround from "~PlayGround";

import { type AlertState, AlertContext } from "~Context";


const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';

function HelpText({text}:{text: string}) {
  const [show, setShow] = useState(false);
  return <label className="form-label">
    <FaQuestionCircle className="link text-blue-500" onClick={()=>{
      setShow(!show);
    }}/>
    {show?<span className="form-label-alt "> {text}</span>: null}
</label>
}

function IndexPopup() {
  const [domain, setDomain] = useState("")
  const [type, setType] = useState(RuleActionType.autoHide)
  const [name, setName] = useState("");
  const [data, setData] = useState("");
  const [editorContent, setEditorContent] = useState({});

  const [_, showAlert] = useContext(AlertContext);

  const showOk = (message: string)=>{
    showAlert({
      type: 'success',
      message: message,
      autoHide: 2
    })
  }

  const saveRule = async () => {
    let rule = { type, name, data}
    let ruleJSON = await storage.get(kUniKey) || {};
 
    let ruleForDomain = ruleJSON[domain];
    if (!ruleForDomain) {
      ruleForDomain = [];
    }
    ruleForDomain.push(rule);
    ruleJSON[domain] = ruleForDomain;

    try {
      await storage.set(kUniKey, ruleJSON);
      setEditorContent(ruleJSON);
      showOk('保存成功');
    } catch (error) {
      alert('出错了：' + error.message);
    }
  }

  // let updateJSON = '';
  let updateJSON = {
    updated: ''
  };
  const saveRawRule = async () => {
    try {
      await storage.set(kUniKey, editorContent);
      showOk('保存成功');
    } catch (error) {
      alert('出错了：' + error.message);
    }
  }

  const [onlyView, setEditorState] = useState(true);

  useEffect(() => {
    const init = async () => {
      let original: any = await storage.get(kUniKey);
      if (!original) {
        original = {}
      } else if (typeof original == 'string') {
        original = JSON.parse(original);
      }
      setEditorContent(original);
    };
    init();
  }, []);

  const copyRule = ()=>{
    let v = JSON.stringify(editorContent);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(v);
    } else {
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.setAttribute('value', v);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showOk('已复制');
    }
  };

  return (<section className="bg-gray-2 rounded-x p-8 shadow-lg">
    <div className="">
      <h2 className="text-lg font-medium pt-2 pb-4">
        添加规则 (新规则覆盖旧规则)
      </h2>
      
      <form className="form-group" style={{
        gap: '1.25rem'
      }} onSubmit={saveRule}>
          <div className="form-field">
            <div className="flex flex-row items-center gap-1">
              <label className="text-base">匹配网页地址规则</label>
              <HelpText text="如，example.com/path* , *.example.com/path, file.exmaple.com" />
            </div>
            <input className="input input-solid " placeholder="输入网页地址规则" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
            <a className="link link-underline" href="#tab=2">前去测试规则是否符合预期</a>
          </div>
          <div className="form-field">
            <label className="text-base">类型</label>
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
            <div className="flex flex-row items-center gap-1">
              <label className="text-base" htmlFor="message">匹配的选择器 (以及规则）</label>
              <HelpText text="如，.modals .modal__login .close , .passport-container-mini &#123; display: none !important;&#125; (注入样式)" />
            </div>
            <input className="input input-solid max-w-full" id="message" placeholder="输入样式规则，可参考下方预览里内容" required onChange={(e) => setData(e.target.value)} value={data} />
          </div>
          <div className="form-field">
            <div className="flex flex-row items-center gap-1">
              <label className="text-base">规则名称</label>
              <HelpText text="设置为容易记忆的名称" />
            </div>
            <input className="input input-solid" id="name" placeholder="输入对样式规则对描述，便于区别" required onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <div className="form-field">
            <div className="form-control justify-between">
              <button type="submit" style={{
                width: 200
              }} className="rounded-lg btn btn-primary btn-block">保存</button>
            </div>
          </div>
        </form>
    </div>
    <div id="preview" className="mt-2">
      <div className="flex flex-row gap-2 items-center">
          <span className="text-lg font-medium">当前生效的规则预览 </span>
          <label className="flex cursor-pointer gap-1 text-red-600">
            <input type="checkbox" className="checkbox" checked={!onlyView} onChange={(e)=>{setEditorState(!onlyView);}} />
            <span>容许编辑文件(高级用户使用）</span>
          </label>
      </div>
      <div style={{
        display: 'flex',
        gap: 8,
        flexDirection: 'column',
        minHeight: 500
      }} id="editor">
        <div className="my-editor">
          <VanillaJSONEditor
            content={{
              "json": editorContent
            }}
            mode="text"
            readOnly={onlyView}
            onChange={(input) => {
              console.log('VanillaJSONEditor', input);
              updateJSON.updated = input.text || input.json;
            }}
            onBlur={()=>{
              let json = editorContent;
              console.log('onblur',updateJSON);
              if (updateJSON.updated) {
                if(typeof updateJSON.updated === 'string') {
                  json = JSON.parse(updateJSON.updated);
                } else {
                  json = updateJSON.updated;
                }
                updateJSON.updated = null;
              }
              setEditorContent(json);
            }}
          />
        </div>
        <div className="flex flex-row">
          <button className="btn btn-solid-error" style={{
            width: 200
          }} onClick={saveRawRule} disabled={onlyView} >保存( 谨慎使用) </button>
          <button className="btn btn-ghost underline" onClick={()=>{
            setEditorContent(builtinRule);
          }}>载入样例规则</button>
          <div className="flex flex-row items-center gap-2 underline text-blue-600 text-sm">
            <a href="https://github.com/hite/AccessHappily/issues/1" onClick={copyRule} target="_blank">复制并发布自己的规则</a>{" "} <FaExternalLinkAlt />
          </div>
        </div>
      </div>
    </div>
  </section>)
}

export default Options;

function Options() {
  let [alert, showAlert] = useState<AlertState>(null);
  return (
    <AlertContext.Provider value={[alert, showAlert]}>
      <SideBarContent />
    </AlertContext.Provider>
  );
}

function SideBarContent() {
  const [alert, showAlert] = useContext(AlertContext);
  let icons = [<MdOutlineDashboardCustomize/>, <FaSlideshare></FaSlideshare>,<GrDocumentTest></GrDocumentTest>, <FiSettings></FiSettings>];
  let tabIdx = 0;
  if(window.location.hash) {
    let queryObjs = window.location.hash.replace('#','').split('&').filter((o)=>{return o.startsWith('tab=')});
    if(queryObjs.length > 0){
      tabIdx = parseInt(queryObjs[0].replace('tab=',''));
      if(isNaN(tabIdx) || tabIdx <0 || tabIdx > icons.length){
        tabIdx = 0;
      }
    }
  }

  const [activeTab, setActiveTab] = useState(tabIdx);
  let contents = [<IndexPopup/>, <Suscription></Suscription>, <PlayGround></PlayGround>,<Settings></Settings>];
  let content = contents[activeTab];
  let tabNames = ['编辑自定义规则','订阅远程规则','测试规则','设置'];

  let lis = tabNames.map((o, idx)=>{
    return <li key={idx} className={activeTab == idx ? "menu-item menu-active":"menu-item"} onClick={(e)=>{
      setActiveTab(idx);
    }}>
      {icons[idx]}
      <span>{o}</span>
    </li>
  })

  let alertInfo = null;
  if(alert) {
    alertInfo = <div className="fixed w-full z-[100]">
    <div className={`alert alert-${alert.type} w-1/3 mx-auto`}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM24 34C22.9 34 22 33.1 22 32V24C22 22.9 22.9 22 24 22C25.1 22 26 22.9 26 24V32C26 33.1 25.1 34 24 34ZM26 18H22V14H26V18Z" fill="#0085FF" />
      </svg>
      <div className="flex flex-col">
        <span className="text-lg">{alert.title || '提示'}</span>
        <span className="text-content2">{alert.message}</span>
      </div>
    </div>
  </div>
  }
  useEffect(()=>{
    if(alert) {
      window.setTimeout(()=>{
        showAlert(null);
      }, 2000);
    }
  },[alert])

  let logo = require('~/assets/icon.png');
  return <div className="sticky flex flex-row overflow-y-auto sm:overflow-x-hidden">
    <aside className="sidebar h-full justify-start m-4 rounded-lg shadow-lg">
      <section className="sidebar-title items-center p-4">
        <div className="avatar">
          <img src={logo} alt="avatar" />
        </div>
        <div className="flex flex-col gap-1 ml-1">
          <span>AccessHappily</span>
          <span className="text-xs font-normal text-content2">那些看不惯,就去改变它</span>
        </div>
      </section>
      <section className="sidebar-content h-fit min-h-[20rem] overflow-visible">
        <nav className="menu rounded-md">
          <section className="menu-section px-4">
            <span className="menu-title text-lg">主菜单</span>
            <ul className="menu-items ">
              {lis}
            </ul>
          </section>
        </nav>
      </section>
    </aside>
    <div className="flex w-full flex-row flex-wrap gap-4 m-4">
      {content}
    </div>
    {alertInfo}
  </div>;
}
