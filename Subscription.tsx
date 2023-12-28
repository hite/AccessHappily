import { useContext, useEffect, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import "./style.css";

import VanillaJSONEditor from "./VanillaJSONEditor";

import { Storage } from "@plasmohq/storage";
import { AlertContext } from "~Context";
const storage = new Storage()
const kUniKey = 'KeyOfRuleForDomains';
const kRemoteRule = 'kRemoteRuleForDomains';
const kDBKeySettings = 'kDBKeySettings';
// 订阅部分
interface RemoteRule {
    name: string,
    url: string,
    content: string,
    enabled: boolean
  }
  export default function Suscription() {
    let initialData: RemoteRule[] = [];
    const [data, setData] = useState(initialData);
    const [_, showAlert] = useContext(AlertContext);

    function saveToDB(newData: any) {
      try {
        storage.set(kRemoteRule, newData);
        showAlert({
          type: 'success',
          message: '保存成功',
          autoHide: 2
        })
      } catch (error) {
        alert('保存出错');
      }
    }

    useEffect(() => {
      storage.get(kRemoteRule).then((val) => {
        let list: any = val ? val : [];
        setData(list);
      });
    }, []);
  
    return <div className="flex flex-col gap-8 bg-gray-2 rounded-x p-8 shadow-l w-2/3">
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
                alert('内容错误');
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
  