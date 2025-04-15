import Image from "next/image";
import "./style.css";



export default function Page() {
  return <div className="invitation-card">
  <div className="header">
      <div className="img">
        <Image src="/images/image1.jpg" width={600} height={300} alt=""/>
      </div>
  </div>
  
  <div className="content">
      <div className="decoration top-left"></div>
      <div className="decoration bottom-right"></div>
      <h1>婚宴邀请函</h1>
      <div className="couple-names">邓李思妤 <span className="heart"></span> 顾小欣</div>
      <p>诚挚邀请您见证我们的幸福时刻</p>
      <p>亲爱的朋友：</p>
      <p>诚挚邀请您共同分享喜悦</p>
      <div className="date-time">
          2025年5月2日 中午12:08分
      </div>
      
      <div className="location">
          <h3>宴会地点</h3>
          <p>常州富都voco酒店.钻石厅</p>
          <p>江苏省常州市新北区通江大道398号</p>
      </div>
      
      <p>期待您的光临！</p>
  </div>
  
  <div className="footer">
      恭候光临 · 敬请赐复
  </div>
</div>
}