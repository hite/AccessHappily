import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage"
import { builtinRule } from "~rules";
import "./style.css";

import JSONInput from 'react-json-editor-ajrm';
import locale    from 'react-json-editor-ajrm/locale/en';
import { isMatched } from "~content";

function IndexPopup() {
  const [domain, setDomain] = useState("")
  const [type, setType] = useState("autoHide")
  const [data, setData] = useState("");

  const [editorContent, setEditorContent] = useState({});

  const storage = new Storage()
  const uniKey = 'KeyOfRuleForDomains';
  const saveRule = async ()=>{
    if(domain.length * type.length * data.length == 0) {
      alert('字段不能为空');
      return;
    }

    let rule = {type, data}
    let ruleJSON = {};
    ruleJSON = await storage.get(uniKey);
    if(!ruleJSON) {
      ruleJSON = builtinRule;
    }
    let ruleForDomain = ruleJSON[domain];
    if (!ruleForDomain) {
      ruleForDomain = [];
    }
    ruleForDomain.push(rule);
    ruleJSON[domain] = ruleForDomain;
    
    let succ = await storage.set(uniKey, ruleJSON);
    setEditorContent(ruleJSON);
    alert('保存成功');
  }

  const saveRawRule = async ()=>{
    let succ = await storage.set(uniKey, editorContent);
    alert('保存成功');
  }

  const [editorState, setEditorState] = useState(false);
  let toggleEditor = ()=>{
    setEditorState(!editorState);
  }
  useEffect(()=>{
    const init =async () => {
      let original: any = await storage.get(uniKey);
      if (!original) {
        original = builtinRule
      } else if(typeof original == 'string') {
        original = JSON.parse(original);
      }
      setEditorContent(original);
    };
    init();
  },[]);

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
          <select className="select" defaultValue="autoHide">
          <option value="autoHide">自动隐藏元素</option>
          <option value="autoClick">自动点击元素</option>
          <option value="insertCSS">注入样式</option>
        </select>
				</div>

			</div>

			<div className="w-full">
				<label className="sr-only" htmlFor="message">匹配的选择器( ID / className / tag 选择器均可)</label>
        <input className="input input-solid max-w-full" placeholder="输入样式规则，可参考下方原始文件" required onChange={(e) => setData(e.target.value)} value={data} />
			</div>

			<div className="mt-4">
				<button type="button" style={{
          width: 200
        }} className="rounded-lg btn btn-primary btn-block" onClick={saveRule}>保存</button>
			</div>
		</form>
    
	  </div>
    <div id="preview" className="p-6">
    <h5 style={{
        cursor:'pointer',
        color:'red'
      }} onClick={toggleEditor}>▼直接编辑文件(高级用户使用）</h5>
      <div style={{
        display: editorState?'flex': 'none',
        gap:8,
        flexDirection:'column',
        minHeight:500
      }} id="editor">
        
      <JSONInput
        id          = 'a_unique_id'
        placeholder = { editorContent }
        locale      = { locale }
        height      = '550px'
        onChange={input => setEditorContent(input.jsObject)}
    />
      <button className="btn btn-solid-error" style={{
        width: 200
      }} onClick={saveRawRule} >保存( 谨慎使用) </button>
      </div>
    </div>

  </section>)
}

function PlayGround() {
  const [rule, setRule] = useState('');
  const [url, setUrl] = useState('');

  const [checkState, setCheckState] = useState('');
  const validate = ()=>{
    setCheckState(isMatched(rule, url)? 'succ':'failed')
  };

  
  let validation = <label className="form-label">
  <span className="form-label-alt">未测试</span></label> ;
  if (checkState.length > 0 ) {
    validation = checkState == 'succ' ? <label className="form-label">
      <span className="form-label-alt text-success">匹配</span></label> : 
      <label className="form-label">
			<span className="form-label-alt text-error">不匹配</span>
		</label>;
  } 

  return <div className="form-group p-4">
    <div className="form-field">
    <label className="form-label">规则</label>
      <input placeholder="输入地址规则" type="text" className="input max-w-full" value={rule} onChange={(e)=>{
        setRule(e.target.value);
        setCheckState('');
        }}/>
    </div>
    <div className="form-field">
      <label className="form-label">目标地址</label>

      <input placeholder="目标地址，包含 https:// 前缀" type="text" className="input max-w-full" value={url} onChange={(e)=>{setUrl(e.target.value);setCheckState('');}}/>
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
  let content = activeTab == 1 ? <IndexPopup></IndexPopup> : <PlayGround></PlayGround>;
  return (<div className="p-6">
        <div className="tabs gap-1">
      <div className={activeTab == 1 ? "tab tab-bordered px-6 tab-active": "tab tab-bordered px-6"} onClick={()=>{
        setActiveTab(1);
      }}>编辑规则</div>
      <div className={activeTab == 2 ?  "tab tab-bordered px-6 tab-active": "tab tab-bordered px-6"} onClick={()=>{
        setActiveTab(2);
      }}>测试规则</div>
    </div>
    {content}
  </div>)
}