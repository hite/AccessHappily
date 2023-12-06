import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage"
import { builtinRule } from "~content";
import cssText from 'data-text:~style.css';
import "./style.css"

function IndexPopup() {
  const [domain, setDomain] = useState("")
  const [type, setType] = useState("autoHide")
  const [data, setData] = useState("");

  const [editorContent, setEditorContent] = useState('');

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

    setEditorContent(JSON.stringify(ruleJSON));
    alert('保存成功');
  }

  const saveRawRule = ()=>{
    try {
      JSON.parse(editorContent);
    } catch (error) {
      alert('格式错误，保存失败')
    }
    storage.set(uniKey, editorContent);
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
      }
      setEditorContent(JSON.stringify(original));
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
				<label className="sr-only" htmlFor="name">域名前缀</label>
				<input className="input input-solid " placeholder="输入完整域名/前缀" type="text" id="name" required onChange={(e) => setDomain(e.target.value)} value={domain} />
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="sr-only" htmlFor="email">类型</label>
          <select className="select">
          <option value="autoHide" selected>自动隐藏元素</option>
          <option value="autoClick">自动点击元素</option>
          <option value="insertCSS">注入样式</option>
        </select>
				</div>

			</div>

			<div className="w-full">
				<label className="sr-only" htmlFor="message">匹配的选择器( ID / className / tag 选择器均可)</label>
        <input className="input input-solid max-w-full" required onChange={(e) => setData(e.target.value)} value={data} />
			</div>

			<div className="mt-4">
				<button type="button" style={{
          width: 200
        }} className="rounded-lg btn btn-primary btn-block">保存</button>
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
        
        <textarea className="textarea textarea-solid max-w-full" placeholder="Message" rows="8" value={editorContent} onChange={(e) => setEditorContent(e.target.value)}></textarea>
        
      <button className="btn btn-solid-error" style={{
        width: 200
      }} onClick={saveRawRule} >保存( 谨慎使用 </button>
      </div>
    </div>
  </section>)
}

export default IndexPopup

function Sample() {
  return <section className="bg-gray-2 rounded-xl">
</section>
}