import { useState } from "react";
import "./style.css";

import { isMatched } from "~rules";


export default function PlayGround() {
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