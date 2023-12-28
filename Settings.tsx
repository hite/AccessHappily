import { useEffect, useState, type FormEvent, useContext } from "react";
import { Storage } from "@plasmohq/storage";
import { AlertContext } from "~Context";
const storage = new Storage();
const kDBKeySettings = 'kDBKeySettings';

export default function Settings() {
    const [tipsOn, setTipsOn] = useState(true);
    const [autoClickDelay, setAutoClickDelay] = useState(1);// 2s
    const [autoHideDelay, setAutoHideDelay] = useState(1);// 2s
    const [observeInterval, setObserveInterval] = useState(1.5);//
    const [tipsHideDelay, setTipsHideDelay] = useState(2);//
    
    const [_, showAlert] = useContext(AlertContext);

    useEffect(()=>{
      let init =async () => {
        let on: any = await storage.get(kDBKeySettings);
        if(!on) {
          on = {};
        }
        setTipsOn(!!on['tipsOn']);
        setAutoHideDelay(on['autoHideDelay']);
        setAutoClickDelay(on['autoClickDelay']);
        setObserveInterval(on['observeInterval']);
        setTipsHideDelay(on['tipsHideDelay']);
      };
      init();
    },[]);
  
    const saveUpdated = (e: FormEvent)=>{
      let on = {};
      on['tipsOn'] = tipsOn;
      on['autoHideDelay'] = autoHideDelay;
      on['autoClickDelay'] = autoClickDelay;
      on['observeInterval'] = observeInterval;
      on['tipsHideDelay'] = tipsHideDelay;
      try {
        storage.set(kDBKeySettings, on);
        showAlert({
          type: 'success',
          title: '提示',
          message: '已保存',
          autoHide: 2
        });
      } catch (error) {
        window.alert(error.message)
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