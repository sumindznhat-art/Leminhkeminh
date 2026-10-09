/* ============================================================
   TOOLS.JS — Kết nối API + điều khiển panel AI
   ============================================================ */
(function(){
  'use strict';

  class Bd {
    constructor(port){
      this.port=port;
      this.url=port.api_url;
      this.eng=new window.TEEngine.Yq();
      this.ai=new window.TEEngine.Zw();
      this.lastSid=null;this.im=false;this.lastGy=null;this.timer=null;
    }
    el(id){return document.getElementById(id);}
    circles(h,nhay,rt,rx){
      const t=this.el('taiCircle'),x=this.el('xiuCircle');
      t.classList.remove('active','resting');x.classList.remove('active','resting');
      if(rt!=null&&rx!=null){t.textContent=Math.round(rt)+'%';x.textContent=Math.round(rx)+'%';}
      else{t.textContent='--%';x.textContent='--%';}
      if(!h)return;
      (h==='TAI'?t:x).classList.add(nhay?'active':'resting');
    }
    conf(d,nhay){
      const box=this.el('confBox'),bar=this.el('confBar');
      const lv=box.querySelector('.conf-level'),nm=box.querySelector('.conf-num');
      if(!nhay||d<50){
        box.classList.remove('show','mid','ok','high');
        bar.style.width='0%';bar.classList.remove('high');
        return;
      }
      let label='',cls='';
      if(d>=80){label='CAO';cls='high';}
      else if(d>=70){label='ỔN';cls='ok';}
      else{label='TRUNG BÌNH';cls='mid';}
      lv.textContent=label;nm.textContent=d+'%';
      box.classList.add('show');
      box.classList.remove('mid','ok','high');
      box.classList.add(cls);
      bar.style.width=Math.min(100,d)+'%';
      bar.classList.toggle('high',d>=80);
    }
    start(){
      if(this.timer)return;
      this.tick();
      this.timer=setInterval(()=>this.tick(),4000);
    }
    stop(){
      if(this.timer){clearInterval(this.timer);this.timer=null;}
    }
    async tick(){
      try{
        const res=await fetch(this.url,{cache:'no-store'});
        if(!res.ok)throw 0;
        const data=await res.json();
        let list=data.list||data.data||data.sessions||data.result||data;
        if(list&&typeof list==='object'&&!Array.isArray(list)){
          if(list.data&&Array.isArray(list.data))list=list.data;
          else if(list.list&&Array.isArray(list.list))list=list.list;
          else if(list.result&&Array.isArray(list.result))list=list.result;
          else if(list.records&&Array.isArray(list.records))list=list.records;
          else if(list.items&&Array.isArray(list.items))list=list.items;
        }
        if(!Array.isArray(list)||!list.length)throw 0;
        const asc=[...list].sort((a,b)=>(a.id||0)-(b.id||0));
        const nid=list[0].id??asc[asc.length-1].id;
        if(this.lastSid!==null&&nid!==this.lastSid){
          const last=asc[asc.length-1];
          const kq=last.resultTruyenThong||last.result||last.ketQua||last.result_str;
          if(this.lastGy&&kq)this.ai.track(kq);
          this.im=true;
          this.circles(null,false,null,null);
          this.conf(0,false);
          this.el('sidValue').textContent='#'+nid;
          this.el('statusText').textContent='Đang chờ...';
          this.el('statusText').classList.remove('analyzing');
          setTimeout(()=>{this.im=false;this.analyze(asc,nid);},5000);
          this.lastSid=nid;
          return;
        }
        this.lastSid=nid;
        this.el('sidValue').textContent='#'+(nid+1);
        if(!this.im)this.analyze(asc,nid);
      }catch(e){
        this.el('statusText').textContent='Đang kết nối...';
        this.el('statusText').classList.remove('analyzing');
      }
    }
    analyze(asc,nid){
      this.eng.nap(asc);
      const qs=this.eng.scan();
      this.el('sidValue').textContent='#'+(nid+1);
      if(qs.gy){
        const d=this.ai.calc(this.eng.ch,qs.gy,qs.n,qs.rt,qs.tin);
        this.circles(qs.gy,true,qs.rt,qs.rx);
        this.conf(d,true);
        this.el('statusText').textContent='Đang chờ...';
        this.el('statusText').classList.add('analyzing');
        this.lastGy=qs.gy;
      }else{
        this.circles(null,false,null,null);
        this.conf(0,false);
        this.el('statusText').textContent='Đang chờ...';
        this.el('statusText').classList.remove('analyzing');
        this.lastGy=null;
      }
    }
  }

  window.Bd=Bd;
})();
