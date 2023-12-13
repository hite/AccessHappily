
import { useEffect, useState } from "react";
import { IoMdSettings } from "react-icons/io";
import { FaQuestionCircle } from "react-icons/fa";
import "./style.css";
import type { IRuleAction } from "~rules";

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

  let trs = [<tr>
    <th colSpan={4}>无生效的规则</th>
  </tr>];

  if(data.length > 0 ) {
    trs = data.map((o, idx)=>{
      let desc = '';
      if(o.type == 'insertCSS') {
        desc = '立即生效'
      } else if(['insertCSS'].includes(o.type)){
        desc = '下次刷新生效'
      }
      return <tr>
      <th>{idx + 1}</th>
      <td>{o.type}</td>
      <td>{o.name || o.data}</td>
      <td>
        <div>
          <label className="flex cursor-pointer gap-2">
            <input type="checkbox" className="checkbox" />
            <span>启用</span>
          </label>
        </div>
        {desc}
      </td>
    </tr>
    });
  }

  return (
    <div
      style={{
        padding: 12,
        minWidth: 350
      }} className="flex flex-col gap-2">
      <h4 className="font-bold text-sm text-teal-600">欢迎使用 AccessHappily</h4>
      <div>
        <p>{message}</p>
        <div className="flex items-center gap-1 py-3">
          <span className="dot dot-secondary"></span>
          <h1 className="text-xl font-semibold">当前生效的规则</h1>
          <div className="tooltip tooltip-top" data-tooltip="管理本页面当前生效的规则">
            <FaQuestionCircle />
          </div>
        </div>
        <div className="flex w-full overflow-x-auto">
          <table className="table-compact table max-w-4xl">
            <thead>
              <tr>
                <th>序号</th>
                <th>类型</th>
                <th>名称</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {trs}
            </tbody>
          </table>
        </div>
      </div>

      <div className="font-bold flex flex-row gap-1 items-center text-blue-600">
        <IoMdSettings /><a href="/options.html" target="_blank">进入设置</a>{" "}
      </div>
    </div>
  )
}
export default Popup;