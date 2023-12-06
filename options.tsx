import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage"
import { builtinRule } from "~content";


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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h2>
        添加规则 (新规则覆盖旧规则)
      </h2>
      <p>
        <label>域名前缀</label>
        <input required onChange={(e) => setDomain(e.target.value)} value={domain} />
      </p>
      <p>
        <label>类型( autoHide / autoClick/ insertCSS)</label>
        <input required onChange={(e) => setType(e.target.value)} value={type} />
      </p>
      <p>
        <label>匹配的选择器( ID / className / tag 选择器均可)</label>
        <input required onChange={(e) => setData(e.target.value)} value={data} />
      </p>
      <input style={{
        width: 100
      }} type='button' onClick={saveRule} value='保存'></input>
      <h5 style={{
        cursor:'pointer',
        color:'red'
      }} onClick={toggleEditor}>▼直接编辑文件(高级用户使用）</h5>
      <div style={{
        display: editorState?'flex': 'none',
        flexDirection:'column',
        minHeight:500
      }} id="editor">
        
        <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)}></textarea>
        <input style={{
        width: 140
      }} type='button' onClick={saveRawRule} value='保存( 谨慎使用 ）'></input>
      </div>
    </div>
    
  )
}

export default IndexPopup
