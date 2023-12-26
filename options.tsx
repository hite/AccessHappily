import { useEffect, useState, type FormEvent } from "react";
import { RuleActionType, builtinRule } from "~rules";
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaQuestionCircle } from "react-icons/fa";
import { FaSlideshare } from "react-icons/fa";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { GrDocumentTest } from "react-icons/gr";
import "./style.css";

import { isMatched } from "~rules";
import VanillaJSONEditor from "./VanillaJSONEditor";

import { Storage } from "@plasmohq/storage"
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';
const kRemoteRule = 'kRemoteRuleForDomains';
const kDBKeySettings = 'kDBKeySettings';

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
      alert('保存成功');
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
      alert('保存成功');
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
    <div id="preview">
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

function PlayGround() {
  const [rule, setRule] = useState('');
  const [url, setUrl] = useState('');

  const [checkState, setCheckState] = useState('');
  const validate = () => {
    setCheckState(isMatched(rule, url) ? 'succ' : 'failed')
  };

  let validation = <label className="form-label">
    <span className="form-label-alt">未测试</span></label>;
  if (checkState.length > 0) {
    validation = checkState == 'succ' ? <label className="form-label">
      <span className="form-label-alt text-success">匹配</span></label> :
      <label className="form-label">
        <span className="form-label-alt text-error">不匹配</span>
      </label>;
  }

  return <div className="form-group bg-gray-2 rounded-x p-8 shadow-lg w-2/3">
    <div className="form-field">
      <label className="form-label">网页地址规则</label>
      <input placeholder="输入匹配网页地址规则" type="text" className="input max-w-full" value={rule} onChange={(e) => {
        setRule(e.target.value);
        setCheckState('');
      }} />
    </div>
    <div className="form-field">
      <label className="form-label">目标地址</label>
      <input placeholder="目标地址，包含 https:// 前缀" type="text" className="input max-w-full" value={url} onChange={(e) => { setUrl(e.target.value); setCheckState(''); }} />
      {validation}
    </div>

    <div className="form-field">
      <button type="button" className="btn gap-2 bg-gray-5 w-24" onClick={validate}>测试</button>
    </div>
  </div>
}

export default SideBarContent

function Tab() {
  const [activeTab, setActiveTab] = useState(0);
  let contents = [<IndexPopup/>, <Suscription></Suscription>, <PlayGround></PlayGround>,<Settings></Settings>];
  let content = contents[activeTab];
  let tabNames = ['编辑自定义规则','订阅远程规则','测试规则','设置'];
  let tabs = tabNames.map((o, idx)=>{
    return <div key={idx} className={activeTab == idx ? "tab tab-bordered px-6 tab-active" : "tab tab-bordered px-6"} onClick={() => {
      setActiveTab(idx);
    }}>{o}</div>
  });
  return (<div className="p-6">
    <div className="tabs gap-1">
      {tabs}
    </div>
    {content}
  </div>)
}

function SideBarContent() {
  const [activeTab, setActiveTab] = useState(0);
  let icons = [<MdOutlineDashboardCustomize/>, <FaSlideshare></FaSlideshare>,<GrDocumentTest></GrDocumentTest>, <FiSettings></FiSettings>];
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

  let logo = require('~/assets/icon.png');
  return <div className="sticky flex flex-row overflow-y-auto rounded-lg shadow-lg sm:overflow-x-hidden">
    <aside className="sidebar h-full justify-start m-4">
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
  </div>;
}
// 订阅部分
interface RemoteRule {
  name: string,
  url: string,
  content: string,
  enabled: boolean
}
function Suscription() {
  let initialData: RemoteRule[] = [];
  const [data, setData] = useState(initialData);

  useEffect(() => {
    storage.get(kRemoteRule).then((val) => {
      let list: any = val ? val : [];
      setData(list);
    });
  }, []);

  return <div className="flex flex-col gap-8 bg-gray-2 rounded-x p-8 shadow-lg">
    <AddSub onDataAdded={(added) => {
      let newData = [...data, added];
      setData(newData);

      saveToDB(newData);
    }}></AddSub>
    <div className="flex flex-row">
      <TableList data={data} onUpdateData={(updated) => {
        let newData = data.map((o) => {
          if (updated.url === o.url) {
            return updated;
          } else {
            return o;
          }
        });
        setData(newData);
        saveToDB(newData);
      }}></TableList>
    </div>
  </div>
}

function saveToDB(newData: any) {
  try {
    storage.set(kRemoteRule, newData);
    alert('保存成功')
  } catch (error) {
    alert('保存出错')
  }
}

async function loadRemoteUrl(url: string) {
  const myHeaders = new Headers({
    "Content-Type": "text/plain",
  });

  const myRequest = new Request(url, {
    method: "GET",
    headers: myHeaders,
    mode: "cors",
    cache: "default",
  });
  // let result = await resp.json();
  let content = null;
  try {
    let resp = await fetch(myRequest);
    let htmlString = await resp.text();
    // 解析出目标内容
    // 以第一个为准
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    let element = doc.querySelector('.highlight-source-json[data-snippet-clipboard-copy-content]');
    if(element) {
      let attributeValue = element.getAttribute('data-snippet-clipboard-copy-content');
      console.log(attributeValue);
      if(attributeValue) {
        content = JSON.parse(attributeValue)
      }
    }
  } catch (error) {
    alert('获取远端内容失败,' + error.message);
  }
  // 检查是否符合 schema
  if(content.name && content.type && content.matches && content.data) {
    return content;
  }
  alert('数据格式不规范,')
  return null;
}

async function loadRawJSON(url: string) {
  const myHeaders = new Headers({
    "Content-Type": "text/json",
  });

  const myRequest = new Request(url, {
    method: "GET",
    headers: myHeaders,
    mode: "cors",
    cache: "default",
  });
  // let result = await resp.json();
  let content = null;
  let text = null;
  try {
    let resp = await fetch(myRequest);
    let text = await resp.text();
    console.log(text);
  } catch (error) {
    alert('获取远端内容失败,' + error.message);
  }

  if (text) {
    try {
      content = JSON.parse(text);
    } catch (error) {
      alert('解析出错,' + error.message)
    }
  }
  return content;
}

function AddSub({ onDataAdded }: { onDataAdded: (val: RemoteRule) => void }) {
  const [showError, setShowError] = useState('none');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [showLoading, setShowLoading] = useState('none');

  return <div className="flex w-full flex-col gap-6 relative">
    <div className="absolute right-0 top-0">
      <div className="flex flex-row items-center gap-2 underline text-blue-600 text-sm">
        <a href="https://github.com/hite/AccessHappily/issues" target="_blank">前往主页查找远程规则</a>{" "} <FaExternalLinkAlt />
      </div>
    </div>
    <div className="form-group">
      <div className="form-field">
        <label className="form-label">远程规则地址</label>
        <input required placeholder="输入远程规则 url" type="url" className="input max-w-full" value={url} onChange={(e) => setUrl(e.target.value)} />
        <label className="form-label text-gray-600">
          <span className="form-label-alt">{!showError ? 'Please enter a valid url.' :'形如, https://github.com/hite/AccessHappily/issues/1' }</span>
        </label>
      </div>
      <div className="form-field">
        <label className="form-label">规则描述(可选)</label>

        <input required placeholder="为规则起个名字，方便后面管理" type="text" className="input " value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ display: showLoading }}>
        <div className="spinner-dot-intermittent"></div><span className="text-blue-500">获取远端内容...</span>
      </div>
      <div className="form-field pt-5">
        <div className="form-control flex flex-row gap-4">
          <button type="button" className="btn btn-primary" onClick={async () => {
            setShowLoading('block');
            let resp = await loadRemoteUrl(url);
            //
            setShowLoading('none');

            if (resp) {
              onDataAdded({
                name: name,
                url: url,
                content: resp.data,
                enabled: true
              })
            } else {
              throw new Error('内容错误');
            }
          }}>添加</button>

        </div>
      </div>
    </div>
  </div>
}

function TableList({ data, onUpdateData }: { data: Array<RemoteRule>, onUpdateData: (updated: RemoteRule) => void }) {
  const [url, setCurrentUrl] = useState('');
  const [content, setContent] = useState('');
  const [showLoading, setShowLoading] = useState('none');

  
  let trs = [<tr key={1}>
    <th className="p-2" colSpan={5}>无可用的订阅地址</th>
  </tr>]
  if (data.length > 0) {
    trs = data.map((item, idx) => {
      return <tr key={idx}>
        <th>{idx + 1}</th>
        <td>{item.name}</td>
        <td>{item.url}</td>
        <td><input type="checkbox" className="checkbox-primary checkbox" checked={item.enabled} onChange={(e) => {
          item.enabled = e.target.checked;
          // 以 url 为 key
          onUpdateData(item)
        }} /></td>
        <td><label className="btn btn-primary" onClick={() => {
          setCurrentUrl(item.url);
          setContent(item.content);
          let stateinput = document.getElementById('modal-1');
          stateinput.click();
        }}>查看规则</label></td>
      </tr>
    });
  }

  return <div className="flex w-full overflow-x-auto">
    <table className="table-zebra table">
      <thead>
        <tr>
          <th>顺序</th>
          <th>描述</th>
          <th>地址</th>
          <th>是否启用</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {trs}
      </tbody>
    </table>

    <input className="modal-state" id="modal-1" type="checkbox" />
    <div className="modal">
      <label className="modal-overlay" htmlFor="modal-1"></label>
      <div className="modal-content flex flex-col gap-4" style={{
        maxWidth: 'max-content'
      }}>
        <label htmlFor="modal-1" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</label>
        <h2 className="text-xl">查看规则内容</h2>
        <span>{url}</span>
        <button className="btn" style={{lineHeight: 38}}onClick={async () => {
          setShowLoading('block');
          let result = await loadRemoteUrl(url);
          setShowLoading('none');
          setContent(result.data);

        }}>从远端更新</button>
        <div style={{ display: showLoading }}>
          <div className="spinner-dot-intermittent"></div><span className="text-blue-500">获取远端内容...</span>
        </div>

        <div className="my-editor">
          <VanillaJSONEditor
            content={{
              "json": content
            }}
            mode="text"
            readOnly={true}
            // onChange={(input) => { console.log('VanillaJSONEditor', input); }}
          />
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline-primary " onClick={async () => {
            let editing = data.filter((o) => {
              return o.url == url;
            });
            if (editing.length != 1) {
              alert('数据错误');
              return
            }
            let updated = editing[0];
            updated.content = content;
            onUpdateData(updated);

            let stateinput = document.getElementById('modal-1');
            stateinput.click();
          }}>保存</button>
          <label className="btn " htmlFor="modal-1">关闭</label>
        </div>
      </div>
    </div>
  </div>
}

async function getDefaultValue(key: string) {
  let on: any = await storage.get(kDBKeySettings);
  if(!on) {
    on = {};
    await storage.set(kDBKeySettings, on);
  }
  return on[key];
}

function Settings() {
  const [tipsOn, setTipsOn] = useState(true);
  const [autoClickDelay, setAutoClickDelay] = useState(1);// 2s
  const [autoHideDelay, setAutoHideDelay] = useState(1);// 2s
  const [observeInterval, setObserveInterval] = useState(1.5);//
  const [tipsHideDelay, setTipsHideDelay] = useState(2);//
  
  useEffect(()=>{
    let init =async () => {
      let on: any = await storage.get(kDBKeySettings);
      if(!on) {
        on = {};
      }
      setTipsOn(on['tipsOn']);
      setAutoHideDelay(on['autoHideDelay']);
      setAutoClickDelay(on['autoClickDelay']);
      setObserveInterval(on['observeInterval']);
      setTipsHideDelay(on['tipsHideDelay']);
    };
    init();
  },[]);

  const updateValue = async function(key: string, val: any) {
    try {
      let on: any = await storage.get(kDBKeySettings);
      if(!on) {
        on = {};
      }
      on[key] = val;
      storage.set(kDBKeySettings, on);
    } catch (error) {
      alert(error.message)
    }
  }

  const saveUpdated = (e: FormEvent)=>{
    let on = {};
    on['tipsOn'] = tipsOn;
    on['autoHideDelay'] = autoHideDelay;
    on['autoClickDelay'] = autoClickDelay;
    on['observeInterval'] = observeInterval;
    on['tipsHideDelay'] = tipsHideDelay;
    try {
      storage.set(kDBKeySettings, on);
    } catch (error) {
      alert(error.message)
    }
    e.preventDefault();
    return false;
  }

  return <div className="flex w-3/4 flex-col gap-6 bg-gray-2 rounded-x p-8 shadow-lg">
	<div className="flex flex-row gap-2 items-end">
		<h1 className="text-3xl font-semibold">高级设置</h1>
		<p className="text-sm">在这里, 修改程序内置参数</p>
	</div>
  <form onSubmit={saveUpdated}>
    <div className="form-group">
      <div className="form-field">
        <label className="form-label">提示当前执行的规则</label>
        <div className="form-control justify-between">
          <div className="flex gap-2">
            <input type="checkbox" className="checkbox" id="tipsOn" checked={tipsOn} onChange={async (e)=>{
              setTipsOn(e.target.checked);
            }}/>
            <label htmlFor="tipsOn" className="text-base">规则生效时,右上角显示提示条, 此提示条持续若干秒后自动消失.</label>
          </div>
        </div>
      </div>
      <div className="form-field pl-6">
        <label className="form-label">提示条消失的延迟时间</label>
        <input placeholder="延迟,以秒为单位, 范围: 1 ~ 10" type="number" step="0.01"required disabled={!tipsOn} min={1} max={10} className="input" value={tipsHideDelay} onChange={async (e)=>{
              let val = parseFloat(e.target.value);
              setTipsHideDelay(isNaN(val) ? tipsHideDelay : val);
            }}/>
        <label className="form-label">
          <span className="form-label-alt">当某条规则被执行时,弹出的提示持续多少秒</span>
        </label>
      </div>
      <div className="form-field">
        <label className="form-label">自动隐藏元素的延迟</label>
        <input placeholder="延迟,以秒为单位" type="number" step="0.01"className="input" required min={0} max={10} value={autoHideDelay} onChange={async (e)=>{
          let val = parseFloat(e.target.value);
          setAutoHideDelay(isNaN(val) ? autoHideDelay : val);
        }}/>
        <label className="form-label">
          <span className="form-label-alt">在提示后,多久隐藏元素, 0 代表立即隐藏</span>
        </label>
      </div>
      <div className="form-field">
        <label className="form-label">自动点击元素的延迟</label>
        <input placeholder="延迟,以秒为单位" type="number" step="0.01"className="input" required min={0} max={10} value={autoClickDelay} onChange={async (e)=>{
              let val = parseFloat(e.target.value);
              setAutoClickDelay(isNaN(val) ? autoClickDelay : val);
            }}/>
        <label className="form-label">
          <span className="form-label-alt">在提示后,多久执行点击元素动作, 0 代表立即点击</span>
        </label>
      </div>
      <div className="form-field">
        <label className="form-label">检查页面变化的间隔时间</label>
        <input placeholder="延迟,以秒为单位, 范围: 1 ~ 10" type="number" step="0.01"required min={1} max={10} className="input" value={observeInterval} onChange={async (e)=>{
              let val = parseFloat(e.target.value);
              setObserveInterval(isNaN(val) ? observeInterval : val);
            }}/>
        <label className="form-label">
          <span className="form-label-alt">在用户浏览、滚动页面时,某些内容会动态的出现. 这里设置检查动态内容的间隔.<span className="text-warning"> 当间隔过小时,会影响电池续航,增加耗电量,但隐藏新出现元素的速度很快;当间隔过大,性能更好,但隐藏元素可能会有延迟,体验不好. 建议使用默认值.</span></span>
        </label>
      </div>
    
      <div className="form-field">
        <button className="btn w-64 btn-primary">保存</button>
      </div>
    </div>
  </form>
</div>
}