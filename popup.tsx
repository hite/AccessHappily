
import { useEffect, useState } from "react";
import { IoMdSettings, IoIosCopy} from "react-icons/io";
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaQuestionCircle } from "react-icons/fa";
import "./style.css";
import { disableRules, type IRuleAction } from "~rules";

function Popup() {
  const [data, setData] = useState<Array<IRuleAction>>([]);
  const [message, setMessage]= useState('');
  // 接收从 content发送过来的数据
  // chrome.runtime.onMessage.addListener(
  //   function(request, sender, sendResponse){
  //       console.log('popup', request);
  //   }
  // );
  useEffect(()=>{
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"action": "getActiveRules"}, null, (resp)=>{
        console.log('responseCallback', resp);
        if(typeof resp == 'object' && resp.constructor.name == 'Array') {
          setData(resp);
        } else {
          setData([]);
        }
      });
    });
  }, []);

  const createNewRule = ()=>{
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
          action: 'enableCopyText'
      });
    });
  }

  let trs = [<tr>
    <th className="py-2" colSpan={5}>无生效的规则</th>
  </tr>];

  if(data.length > 0 ) {
    trs = data.map((o, idx)=>{
      let desc = '';
      // if(o.type == 'insertCSS') {
      //   desc = '立即生效'
      // } else if(['insertCSS'].includes(o.type)){
      //   desc = '下次刷新生效'
      // }
      let ruleName = o.name || '<no-name>';
      if(ruleName.length > 10) {
        ruleName = ruleName.substring(0, 10) + '...';
      }
      return <tr key={idx}>
      <th>{idx + 1}</th>
      <td>
        <div>
          <label className="flex cursor-pointer gap-2">
            <input type="checkbox" className="checkbox" checked={!o.disabled} onChange={(e)=>{
              o.disabled = !e.target.checked;
              let newData = data.map((item)=>{
                if(o.data ==  item.data && o.name == item.name && o.type == item.type) {
                  return o;
                } else {
                  return item;
                }
              });
              // update UI
              setData(newData);
              // save to cache
              disableRules(o);
            }}/>
            <span>启用</span>
          </label>
        </div>
        {desc}
      </td>
      <td>{o.type}</td>
      <td title={o.name}>{ruleName}</td>
      <td>{o.data}</td>
    </tr>
    });
  }

  return (
    <div
      style={{
        padding: 12,
        minWidth: 420
      }} className="flex flex-col gap-2">
      <h4 className="font-bold text-lg text-teal-600">欢迎使用 AccessHappily</h4>
      <div>
        <p>{message}</p>
        <div className="flex items-center gap-1 py-3">
          <span className="dot dot-secondary"></span>
          <h1 className="text-sm font-semibold">适用于本页面的规则</h1>
          <div className="tooltip tooltip-top" data-tooltip="启用和禁用在下次刷新时生效">
            <FaQuestionCircle />
          </div>
        </div>
        <div className="flex w-full overflow-x-auto">
          <table className="table-compact table max-w-4xl">
            <thead>
              <tr>
                <th>序号</th>
                <th>操作</th>
                <th>类型</th>
                <th>名称</th>
                <th>规则</th>
              </tr>
            </thead>
            <tbody>
              {trs}
            </tbody>
          </table>
        </div>
      </div>

      <div className=" border-indigo-500 flex flex-row justify-between">
        <div className="font-bold flex flex-row gap-1 items-center text-blue-600 pt-4 pb-2 text-sm">
          <FaExternalLinkAlt /><a href="/options.html" target="_blank">进入设置</a>{" "} 
        </div>
        <div className="font-bold flex flex-row gap-1 items-center text-blue-600 pt-4 pb-2 text-sm cursor-pointer" onClick={createNewRule}>
          <IoIosCopy /> 一键去除文本选中限制
        </div>
      </div>
    </div>
  )
}
export default Popup;
