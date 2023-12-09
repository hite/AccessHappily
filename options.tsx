import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage"
import { builtinRule } from "~rules";
import "./style.css";

import { isMatched } from "~content";
import VanillaJSONEditor from "./VanillaJSONEditor";

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
    debugger;
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
          <select className="select" defaultValue={type} onChange={(e) => setType(e.target.value)}>
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
      <div className="my-editor">
        <VanillaJSONEditor
            content={{
              "json": editorContent
            }}
            mode="text"
            readOnly={false}
            onChange={(input)=>{console.log('VanillaJSONEditor',input);setEditorContent(input.json)}}
          />
      </div>
      
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
  let content = <IndexPopup></IndexPopup>;
  if (activeTab == 2) {
    content = <PlayGround></PlayGround>;
  } else if (activeTab == 3) {
    content = <Suscription></Suscription>;
  }
  return (<div className="p-6">
        <div className="tabs gap-1">
      <div className={activeTab == 1 ? "tab tab-bordered px-6 tab-active": "tab tab-bordered px-6"} onClick={()=>{
        setActiveTab(1);
      }}>编辑规则</div>
      <div className={activeTab == 2 ?  "tab tab-bordered px-6 tab-active": "tab tab-bordered px-6"} onClick={()=>{
        setActiveTab(2);
      }}>测试规则</div>
      <div className={activeTab == 3 ?  "tab tab-bordered px-6 tab-active": "tab tab-bordered px-6"} onClick={()=>{
        setActiveTab(3);
      }}>订阅规则</div>
    </div>
    {content}
  </div>)
}

function Suscription() {
  return <div className="flex flex-col py-4 gap-8">
    <AddSub></AddSub>
    <div className="flex flex-row">
      <TableList></TableList>
      
    </div>
  </div>
}


function AddSub() {
  const [showError, setShowError] = useState('none');

  return <div className="flex w-full max-w-sm flex-col gap-6">

    <div className="form-group">
      <div className="form-field">
        <label className="form-label">规则地址</label>

        <input placeholder="Type here" type="url" className="input max-w-full" />
        <label className="form-label" style={{display: showError}}>
          <span className="form-label-alt">Please enter a valid url.</span>
        </label>
      </div>

      <div className="form-field pt-5">
        <div className="form-control justify-between">
          <button type="button" className="btn btn-primary">添加</button>
        </div>
      </div>
    </div>
  </div>
}

function TableList() {
  return <div className="flex w-full overflow-x-auto">
	<table className="table-zebra table">
		<thead>
			<tr>
				<th>顺序</th>
				<th>地址</th>
				<th>是否启用</th>
				<th>操作</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th>1</th>
				<td>Cy Ganderton</td>
				<td>Quality Control Specialist</td>
				<td><label className="btn btn-primary" htmlFor="modal-1">Open Modal</label></td>
			</tr>
			<tr>
				<th>2</th>
				<td>Hart Hagerty</td>
				<td>Desktop Support Technician</td>
				<td><label className="btn btn-primary" htmlFor="modal-1">Open Modal</label></td>
			</tr>
			<tr>
				<th>3</th>
				<td>Brice Swyre</td>
				<td>Tax Accountant</td>
				<td><label className="btn btn-primary" htmlFor="modal-1">Open Modal</label></td>
			</tr>
			<tr>
				<th>3</th>
				<td>Brice Swyre</td>
				<td>Tax Accountant</td>
				<td>Red</td>
			</tr>
			<tr>
				<th>3</th>
				<td>Brice Swyre</td>
				<td>Tax Accountant</td>
				<td>Red</td>
			</tr>
		</tbody>
	</table>
  
  <input className="modal-state" id="modal-1" type="checkbox" />
  <div className="modal">
    <label className="modal-overlay" htmlFor="modal-1"></label>
    <div className="modal-content flex flex-col gap-5" style={{
      maxWidth: 'max-content'
    }}>
      <label htmlFor="modal-1" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</label>
      <h2 className="text-xl">Modal title 1</h2>
      <div className="my-editor">
        <VanillaJSONEditor
            content={{
              "json": {}
            }}
            mode="text"
            readOnly={false}
            onChange={(input)=>{console.log('VanillaJSONEditor',input);}}
          />
      </div>
      <div className="flex gap-3">
        <button className="btn btn-error btn-block">Delete</button>

        <button className="btn btn-block">Cancel</button>
      </div>
    </div>
  </div>
</div>
}