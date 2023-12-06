
import { useState } from "react"

function Popup() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: 200
      }}>
      <h4>
        欢迎使用 AccessHappily
      </h4>
      <a href="/options.html" target="_blank">设置规则</a>{" "}
    </div>
  )

}
export default Popup;