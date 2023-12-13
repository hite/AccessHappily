import { useEffect, useState } from "react";
import { RuleActionType, builtinRule } from "~rules";
import "./style.css";

import { isMatched } from "~rules";
import VanillaJSONEditor from "./VanillaJSONEditor";

import { Storage } from "@plasmohq/storage"
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';
const kRemoteRule = 'kRemoteRuleForDomains';

function IndexPopup() {
  const [domain, setDomain] = useState("")
  const [type, setType] = useState(RuleActionType.autoHide)
  const [data, setData] = useState("");
  const [disalbed, setDisabled] = useState(false);

  const [editorContent, setEditorContent] = useState({});

  const saveRule = async () => {
    if (domain.length * type.length * data.length == 0) {
      alert('字段不能为空');
      return;
    }

    let rule = { type, data }
    let ruleJSON = {};
    ruleJSON = await storage.get(kUniKey);
    if (!ruleJSON) {
      ruleJSON = builtinRule;
    }
    let ruleForDomain = ruleJSON[domain];
    if (!ruleForDomain) {
      ruleForDomain = [];
    }
    ruleForDomain.push(rule);
    ruleJSON[domain] = ruleForDomain;

    let succ = await storage.set(kUniKey, ruleJSON);
    setEditorContent(ruleJSON);
    alert('保存成功');
  }

  const saveRawRule = async () => {
    let succ = await storage.set(kUniKey, editorContent);
    debugger;
    alert('保存成功');
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

  return (<section className="bg-gray-2 rounded-xl">
    <div className="p-8 shadow-lg">
      <h2 className="text-lg font-medium p-2">
        添加规则 (新规则覆盖旧规则)
      </h2>
      <form className="space-y-4">
        <div className="w-full">
          <label className="sr-only" htmlFor="name">网页地址前缀</label>
          <input className="input input-solid " placeholder="输入网页地址规则" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
          <span className="text-sm">  如，example.com/path* , *.example.com/path, file.exmaple.com</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="sr-only" htmlFor="email">类型</label>
            <select className="select" defaultValue={type} onChange={(e) => setType(e.target.value as RuleActionType)}>
              <option value={RuleActionType.autoHide}>自动隐藏元素（页面打开时生效）</option>
              <option value={RuleActionType.autoClick}>自动点击元素（页面打开时生效）</option>
              <option value={RuleActionType.autoNavigate}>自动跳转元素（页面打开时生效）</option>
              <option value={RuleActionType.insertCSS}>注入样式（页面打开期间生效）</option>
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="sr-only" htmlFor="message">匹配的选择器( ID / className / tag 选择器均可)</label>
          <input className="input input-solid max-w-full" id="message" placeholder="输入样式规则，可参考下方原始文件" required onChange={(e) => setData(e.target.value)} value={data} />
        </div>
        <div className="w-full">
          <label className="flex cursor-pointer gap-2">
            <input type="checkbox" className="checkbox" checked={!disalbed} onChange={(e) => setDisabled(!e.target.checked)} />
            <span>是否启用</span>
          </label>
        </div>

        <div className="mt-4">
          <button type="button" style={{
            width: 200
          }} className="rounded-lg btn btn-primary btn-block" onClick={saveRule}>保存</button>
        </div>
      </form>

    </div>
    <div id="preview" className="p-6">
      <div className="flex flex-row gap-2 items-center">
          <span className="text-lg font-medium">当前生效的规则预览 </span>
          <label className="flex cursor-pointer gap-1 text-red-600">
            <input type="checkbox" className="checkbox" checked={onlyView} onChange={(e)=>{setEditorState(e.target.checked);}} />
            <span>容许编辑文件(高级用户使用）</span>
          </label>
      </div>
      <div style={{
        display: 'flex',
        gap: 8,
        flexDirection: 'column',
        minHeight: 500
      }} id="editor">
        <div>
         
        </div>
        <div className="my-editor">
          <VanillaJSONEditor
            content={{
              "json": editorContent
            }}
            mode="text"
            readOnly={onlyView}
            onChange={(input) => {
              console.log('VanillaJSONEditor', input);
              let json = input.json;
              if (!json) {
                json = JSON.parse(input.text);
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

  return <div className="form-group p-4">
    <div className="form-field">
      <label className="form-label">规则</label>
      <input placeholder="输入地址规则" type="text" className="input max-w-full" value={rule} onChange={(e) => {
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

export default Tab

function Tab() {
  const [activeTab, setActiveTab] = useState(1);
  let content = <IndexPopup></IndexPopup>;
  if (activeTab == 2) {
    content = <Suscription></Suscription>;
  } else if (activeTab == 3) {
    content = <PlayGround></PlayGround>;
  }
  return (<div className="p-6">
    <div className="tabs gap-1">
      <div className={activeTab == 1 ? "tab tab-bordered px-6 tab-active" : "tab tab-bordered px-6"} onClick={() => {
        setActiveTab(1);
      }}>编辑自定义规则</div>
      <div className={activeTab == 2 ? "tab tab-bordered px-6 tab-active" : "tab tab-bordered px-6"} onClick={() => {
        setActiveTab(2);
      }}>订阅远程规则</div>
      <div className={activeTab == 3 ? "tab tab-bordered px-6 tab-active" : "tab tab-bordered px-6"} onClick={() => {
        setActiveTab(3);
      }}>测试规则</div>
    </div>
    {content}
  </div>)
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

  return <div className="flex flex-col py-4 gap-8">
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
    alert('远端内容不是合法的 JSON 对象');
  }

  if (text) {
    try {
      content = JSON.parse(text);
    } catch (error) {
      alert('远端内容不是合法的 JSON 对象')
    }
  }
  return content;
}

function AddSub({ onDataAdded }: { onDataAdded: (val: RemoteRule) => void }) {
  const [showError, setShowError] = useState('none');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [showLoading, setShowLoading] = useState('none');

  return <div className="flex w-full max-w-sm flex-col gap-6">
    <div className="form-group">
      <div className="form-field">
        <label className="form-label">规则地址</label>

        <input required placeholder="输入 URL，确保内容是合法的 JSON" type="url" className="input max-w-full" value={url} onChange={(e) => setUrl(e.target.value)} />
        <label className="form-label" style={{ display: showError }}>
          <span className="form-label-alt">Please enter a valid url.</span>
        </label>
      </div>
      <div className="form-field">
        <label className="form-label">规则描述</label>

        <input required placeholder="起个名字" type="text" className="input " value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ display: showLoading }}>
        <div className="spinner-dot-intermittent"></div><span className="text-blue-500">获取远端内容...</span>
      </div>
      <div className="form-field pt-5">
        <div className="form-control justify-between">
          <button type="button" className="btn btn-primary" onClick={async () => {
            setShowLoading('block');
            let content = await loadRemoteUrl(url);
            setShowLoading('none');

            if (content) {
              onDataAdded({
                name: name,
                url: url,
                content: content,
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

  let trs = data.map((item, idx) => {
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
        <button className="btn" onClick={async () => {
          setShowLoading('block');
          let result = await loadRemoteUrl(url);
          setShowLoading('none');
          setContent(result);

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
            onChange={(input) => { console.log('VanillaJSONEditor', input); }}
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