/* HHSL Command signing core (3.23). Shared by the office app and the client signing page (sign.html).
   Uses pdf.js (Apache-2.0) to show pages and pdf-lib (MIT) to write the signed PDF. Both are kept in /assets/. */
(function(){
  var LIB={pdfjs:'assets/lib-pdfjs.cb352d12.mjs',worker:'assets/lib-pdfjs-worker.4aa6904f.mjs',pdflib:'assets/lib-pdf-lib.0fe9d555.js'};
  var H={};
  function abs(u){return new URL(u,document.baseURI).href}
  H.loadPdfJs=async function(){if(window.__hhPdfJs)return window.__hhPdfJs;var lib=await import(abs(LIB.pdfjs));lib.GlobalWorkerOptions.workerSrc=abs(LIB.worker);window.__hhPdfJs=lib;return lib};
  H.loadPdfLib=function(){if(window.PDFLib)return Promise.resolve(window.PDFLib);return new Promise(function(res,rej){var s=document.createElement('script');s.src=LIB.pdflib;s.onload=function(){window.PDFLib?res(window.PDFLib):rej(new Error('pdf-lib'))};s.onerror=function(){rej(new Error('pdf-lib'))};document.head.appendChild(s)})};
  H.MAX_BYTES=700*1024;
  H.b64ToBytes=function(b64){var s=atob(b64),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
  H.bytesToB64=function(u){var s='',CH=0x8000;for(var i=0;i<u.length;i+=CH)s+=String.fromCharCode.apply(null,u.subarray(i,i+CH));return btoa(s)};
  H.sha256=async function(u){var d=await crypto.subtle.digest('SHA-256',u);return Array.from(new Uint8Array(d)).map(function(b){return ('0'+b.toString(16)).slice(-2)}).join('')};
  H.newId=function(){var a=new Uint8Array(24);crypto.getRandomValues(a);return H.bytesToB64(a).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  H.device=function(){var u=navigator.userAgent||'',os=/iPhone|iPad/.test(u)?'iPhone/iPad':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'Mac':'Other',br=/Edg\//.test(u)?'Edge':/SamsungBrowser/.test(u)?'Samsung Internet':/Chrome\//.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'Browser';return (os+' - '+br).slice(0,120)};
  H.when=function(ms){if(!ms)return '';var d=new Date(ms);try{return d.toLocaleString('en-GB',{timeZone:'America/Port_of_Spain',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' (Trinidad time)'}catch(e){return d.toISOString()}};
  H.day=function(ms){var d=ms?new Date(ms):new Date();try{return d.toLocaleDateString('en-GB',{timeZone:'America/Port_of_Spain',day:'numeric',month:'short',year:'numeric'})}catch(e){return d.toDateString()}};
  H.ms=function(v){if(!v)return 0;if(typeof v==='number')return v;if(v.toMillis)return v.toMillis();if(v.seconds)return v.seconds*1000;var t=Date.parse(v);return isNaN(t)?0:t};
  // a photo or scan becomes a one-page PDF
  H.imageToPdf=async function(file){
    var url=URL.createObjectURL(file);try{
      var img=await new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=function(){rej(new Error('image'))};i.src=url});
      var max=1700,sc=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.round(img.naturalWidth*sc),h=Math.round(img.naturalHeight*sc);
      var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
      var L=await H.loadPdfLib(),q=0.85,bytes=null;
      for(var k=0;k<5;k++){var jpg=H.b64ToBytes(c.toDataURL('image/jpeg',q).split(',')[1]);var pdf=await L.PDFDocument.create(),im=await pdf.embedJpg(jpg);var pw=595,ph=Math.round(pw*h/w);if(ph>842){ph=842;pw=Math.round(ph*w/h)}var pg=pdf.addPage([pw,ph]);pg.drawImage(im,{x:0,y:0,width:pw,height:ph});bytes=await pdf.save();if(bytes.length<=H.MAX_BYTES)break;q-=0.15}
      return bytes;
    }finally{URL.revokeObjectURL(url)}
  };
  H.pageCount=async function(bytes){var lib=await H.loadPdfJs();var doc=await lib.getDocument({data:bytes.slice()}).promise;var n=doc.numPages;try{doc.destroy()}catch(e){}return n};
  // show every page (up to 30) as a picture with a layer on top for the boxes
  H.renderPages=async function(bytes,host,width){
    var lib=await H.loadPdfJs();var doc=await lib.getDocument({data:bytes.slice()}).promise;var out=[],n=Math.min(doc.numPages,30),dpr=Math.min(2,window.devicePixelRatio||1);
    host.innerHTML='';
    for(var p=1;p<=n;p++){
      var page=await doc.getPage(p),v1=page.getViewport({scale:1}),sc=width/v1.width,vp=page.getViewport({scale:sc*dpr});
      var wrap=document.createElement('div');wrap.className='sgpage';wrap.dataset.p=String(p-1);wrap.style.width=width+'px';wrap.style.height=Math.round(v1.height*sc)+'px';
      var cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);cv.style.width='100%';cv.style.height='100%';
      var lay=document.createElement('div');lay.className='sglay';lay.dataset.p=String(p-1);
      var num=document.createElement('span');num.className='sgnum';num.textContent='Page '+p+' of '+doc.numPages;
      wrap.appendChild(cv);wrap.appendChild(lay);wrap.appendChild(num);host.appendChild(wrap);
      await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
      out.push({el:wrap,layer:lay,w:width,h:Math.round(v1.height*sc)});
    }
    return {pages:out,total:doc.numPages};
  };
  function clean(t){return String(t==null?'':t).replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014\u2022]/g,'-').replace(/\u2026/g,'...').replace(/[^\x20-\x7E\xA0-\xFF]/g,'?')}
  function wrapText(font,text,size,maxW){var words=clean(text).split(/\s+/),lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,size)>maxW&&cur){lines.push(cur);cur=w}else cur=t});if(cur)lines.push(cur);return lines}
  // the signed copy: the original pages with the signature, name and date stamped in the boxes, plus a signing record page
  H.buildSigned=async function(bytes,r){
    var L=await H.loadPdfLib(),pdf=await L.PDFDocument.load(bytes,{ignoreEncryption:true}),pages=pdf.getPages();
    var font=await pdf.embedFont(L.StandardFonts.Helvetica),bold=await pdf.embedFont(L.StandardFonts.HelveticaBold),ink=L.rgb(0.11,0.24,0.55),dark=L.rgb(0.1,0.1,0.12),grey=L.rgb(0.35,0.38,0.42);
    var signed=r.status==='signed',sig=null;
    if(signed&&r.sigImage){try{sig=await pdf.embedPng(H.b64ToBytes(String(r.sigImage).split(',')[1]))}catch(e){sig=null}}
    var dayTxt=H.day(H.ms(r.signedAt)),boxes=r.boxes||[],hasSign=boxes.some(function(b){return b.t==='sign'}),hsig=null,hDay=r.hhslAt?H.day(H.ms(r.hhslAt)):'';
    if(r.hhslSig){try{hsig=await pdf.embedPng(H.b64ToBytes(String(r.hhslSig).split(',')[1]))}catch(e){hsig=null}}
    boxes.forEach(function(b){if(b.t!=='hsign'&&b.t!=='hname'&&b.t!=='hdate')return;if(!r.hhslSig)return;var pg=pages[b.p];if(!pg)return;var W=pg.getWidth(),Hh=pg.getHeight(),x=b.x*W,y=Hh-(b.y+b.h)*Hh,bw=b.w*W,bh=b.h*Hh;
      if(b.t==='hsign'&&hsig){var s=Math.min(bw/hsig.width,bh/hsig.height),iw=hsig.width*s,ih=hsig.height*s;pg.drawImage(hsig,{x:x+(bw-iw)/2,y:y+(bh-ih)/2,width:iw,height:ih})}
      else if(b.t!=='hsign'){var txt=clean(b.t==='hname'?[r.hhslName,r.hhslPos].filter(Boolean).join(', '):hDay),size=Math.max(6,Math.min(13,bh*0.62));while(size>6&&font.widthOfTextAtSize(txt,size)>bw)size-=0.5;pg.drawText(txt,{x:x+2,y:y+(bh-size)/2+size*0.2,size:size,font:font,color:ink})}});
    if(signed)boxes.forEach(function(b){if(b.t==='hsign'||b.t==='hname'||b.t==='hdate')return;var pg=pages[b.p];if(!pg)return;var W=pg.getWidth(),Hh=pg.getHeight(),x=b.x*W,y=Hh-(b.y+b.h)*Hh,bw=b.w*W,bh=b.h*Hh;
      if(b.t==='sign'&&sig){var s=Math.min(bw/sig.width,bh/sig.height),iw=sig.width*s,ih=sig.height*s;pg.drawImage(sig,{x:x+(bw-iw)/2,y:y+(bh-ih)/2,width:iw,height:ih})}
      else if(b.t!=='sign'){var txt=clean(b.t==='name'?(r.signedName||r.signerName||''):dayTxt),size=Math.max(6,Math.min(13,bh*0.62));while(size>6&&font.widthOfTextAtSize(txt,size)>bw)size-=0.5;pg.drawText(txt,{x:x+2,y:y+(bh-size)/2+size*0.2,size:size,font:font,color:ink})}});
    if(signed&&!hasSign){var sp=pdf.addPage([595,842]);sp.drawText('Signature',{x:56,y:770,size:20,font:bold,color:dark});sp.drawText(clean(r.title||''),{x:56,y:745,size:11,font:font,color:grey});
      if(sig){var s2=Math.min(260/sig.width,90/sig.height);sp.drawImage(sig,{x:56,y:620,width:sig.width*s2,height:sig.height*s2})}
      sp.drawLine({start:{x:56,y:612},end:{x:336,y:612},thickness:0.8,color:dark});sp.drawText('Signature',{x:56,y:598,size:9,font:font,color:grey});
      sp.drawText(clean(r.signedName||r.signerName||''),{x:56,y:562,size:12,font:font,color:ink});sp.drawLine({start:{x:56,y:556},end:{x:336,y:556},thickness:0.8,color:dark});sp.drawText('Name',{x:56,y:542,size:9,font:font,color:grey});
      sp.drawText(clean(dayTxt),{x:56,y:506,size:12,font:font,color:ink});sp.drawLine({start:{x:56,y:500},end:{x:236,y:500},thickness:0.8,color:dark});sp.drawText('Date',{x:56,y:486,size:9,font:font,color:grey})}
    var ap=pdf.addPage([595,842]),y=780;function line(label,val){var lines=wrapText(font,val||'-',10.5,340);ap.drawText(clean(label),{x:56,y:y,size:10.5,font:bold,color:dark});lines.forEach(function(l,i){ap.drawText(l,{x:196,y:y-i*14,size:10.5,font:font,color:dark})});y-=Math.max(1,lines.length)*14+8}
    ap.drawText('Signing record',{x:56,y:y,size:20,font:bold,color:dark});y-=22;ap.drawText('HHSL Safety Systems Limited - HHSL Command',{x:56,y:y,size:10,font:font,color:grey});y-=30;
    line('Document',(r.title||'')+(r.fileName&&r.fileName!==r.title?' ('+r.fileName+')':''));
    line('Reference',r.id||'');
    line('Sent by',(r.createdByName||'')+(r.createdBy?' <'+r.createdBy+'>':'')+' - '+H.when(H.ms(r.createdAt)));
    line('Signer',(r.signerName||'')+(r.signerEmail?' <'+r.signerEmail+'>':''));
    line('Opened',H.when(H.ms(r.openedAt))||'-');
    if(signed){line('Signed',H.when(H.ms(r.signedAt)));line('Signed as',(r.signedName||'')+' ('+(r.sigType==='type'?'typed':'drawn')+' signature)');line('Agreement','The signer ticked: "I agree to sign this document electronically."')}
    else if(r.status==='declined'){line('Declined',H.when(H.ms(r.declinedAt)));line('Reason',r.declineReason||'-')}
    line('Device',r.signDevice||r.openDevice||'-');
    if(boxes.some(function(b){return b.t==='hsign'}))line('HHSL signature',r.hhslSig?[r.hhslName,r.hhslPos?'('+r.hhslPos+')':''].filter(Boolean).join(' ')+(r.hhslBy?' <'+r.hhslBy+'>':'')+' - '+H.when(H.ms(r.hhslAt)):'Not signed by HHSL yet');
    line('Document fingerprint','SHA-256 '+(r.docHash||'-'));
    if(r.docHashSeen)line('Check',r.docHashSeen===r.docHash?'The document the signer saw matches this fingerprint.':'Warning: the document the signer saw does not match this fingerprint.');
    y-=10;wrapText(font,'Times are recorded by the server, not by the signer\'s device. The fingerprint changes if any byte of the original document is altered. The signing link was private to the signer.',9,483).forEach(function(l){ap.drawText(l,{x:56,y:y,size:9,font:font,color:grey});y-=12});
    return await pdf.save();
  };
  H.download=function(bytes,name){var b=new Blob([bytes],{type:'application/pdf'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},4000)};
  H.fileName=function(t,suffix){return (String(t||'document').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'document')+(suffix||'')+'.pdf'};
  H.trimPng=function(c){var w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,x0=w,y0=h,x1=0,y1=0;for(var y=0;y<h;y+=2)for(var x=0;x<w;x+=2){if(d[(y*w+x)*4+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}if(x1<=x0||y1<=y0)return null;var p=8;x0=Math.max(0,x0-p);y0=Math.max(0,y0-p);x1=Math.min(w,x1+p);y1=Math.min(h,y1+p);var cw=x1-x0,ch=y1-y0,sc=Math.min(1,600/cw,200/ch),o=document.createElement('canvas');o.width=Math.max(1,Math.round(cw*sc));o.height=Math.max(1,Math.round(ch*sc));o.getContext('2d').drawImage(c,x0,y0,cw,ch,0,0,o.width,o.height);return o.toDataURL('image/png')};
  H.SIGFONT="'Brush Script MT','Segoe Script','Lucida Handwriting','Apple Chancery',cursive";
  H.typedPng=function(t,color){var c=document.createElement('canvas');c.width=900;c.height=220;var x=c.getContext('2d');x.fillStyle=color||'#14181D';x.textBaseline='middle';var sz=110;x.font=sz+'px '+H.SIGFONT;while(sz>30&&x.measureText(t).width>860){sz-=6;x.font=sz+'px '+H.SIGFONT}x.fillText(t,20,115);return H.trimPng(c)};
  // a small drawing pad (used by sign.html and the office My signature page)
  H.pad=function(cv,onDraw){var ctx,down=false,last=null,drawn=false;
    function setup(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;if(!r.width||!r.height)return false;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#14181D';ctx.fillStyle='#14181D';return true}
    function size(){if(setup()){drawn=false;if(onDraw)onDraw(false)}}
    // keep what was drawn when the phone turns: copy it, resize, and fit it back in the middle
    function keep(){if(!drawn){size();return}var old=document.createElement('canvas');old.width=cv.width;old.height=cv.height;old.getContext('2d').drawImage(cv,0,0);var png=H.trimPng(old);if(!setup())return;if(!png)return;var im=new Image();im.onload=function(){var r=cv.getBoundingClientRect(),sc=Math.min((r.width-24)/im.width,(r.height-24)/im.height,1.6),w=im.width*sc,h=im.height*sc;ctx.drawImage(im,(r.width-w)/2,(r.height-h)/2,w,h)};im.src=png}
    var rt=0;function onRs(){clearTimeout(rt);rt=setTimeout(function(){if(document.body.contains(cv))keep()},180)}
    window.addEventListener('resize',onRs);if(window.screen&&screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',onRs);
    function pt(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
    cv.addEventListener('pointerdown',function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}down=true;last=pt(e);ctx.beginPath();ctx.arc(last.x,last.y,1.2,0,Math.PI*2);ctx.fill();if(!drawn){drawn=true;if(onDraw)onDraw(true)}});
    cv.addEventListener('pointermove',function(e){if(!down)return;var p=pt(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p});
    ['pointerup','pointercancel','pointerleave'].forEach(function(n){cv.addEventListener(n,function(){down=false})});
    function setPng(png){if(!setup())return;var im=new Image();im.onload=function(){var r=cv.getBoundingClientRect(),sc=Math.min((r.width-24)/im.width,(r.height-24)/im.height,1.6),w=im.width*sc,h=im.height*sc;ctx.drawImage(im,(r.width-w)/2,(r.height-h)/2,w,h);drawn=true;if(onDraw)onDraw(true)};im.src=png}
    size();return {clear:size,resize:keep,setPng:setPng,drawn:function(){return drawn},png:function(){return drawn?H.trimPng(cv):null}}};
  // Full-screen signature box, turned sideways on the screen: the phone never has to rotate.
  H.fullPad=function(opts){opts=opts||{};var old=document.getElementById('hhfsp');if(old)old.remove();
    var st=document.getElementById('hhfsp-css');if(!st){st=document.createElement('style');st.id='hhfsp-css';st.textContent=
      '#hhfsp{position:fixed;inset:0;z-index:2147483000;background:#fff;touch-action:none;overscroll-behavior:none}'+
      '#hhfsp .hhf-in{position:absolute;top:50%;left:50%;width:100vh;height:100vw;transform:translate(-50%,-50%) rotate(90deg);background:#fff}'+
      '#hhfsp canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}'+
      '#hhfsp .hhf-ln{position:absolute;left:8%;right:8%;bottom:26%;border-top:2px solid #C9D1D9;pointer-events:none}'+
      '#hhfsp .hhf-ph{position:absolute;left:0;right:0;top:38%;text-align:center;color:#9aa6b2;font:600 18px Lato,system-ui,sans-serif;pointer-events:none}'+
      '#hhfsp .hhf-bar{position:absolute;top:12px;right:14px;display:flex;gap:8px;z-index:2}'+
      '#hhfsp .hhf-bar button{position:static;flex:none;width:auto;margin:0;min-height:44px;padding:0 18px;border-radius:12px;border:1px solid #C9D1D9;background:#fff;color:#14506B;font:800 16px Lato,system-ui,sans-serif;cursor:pointer}'+
      '#hhfsp .hhf-bar button.pri{background:#14506B;color:#fff;border-color:#14506B}'+
      '#hhfsp .hhf-who{position:absolute;left:16px;top:18px;color:#4A5661;font:700 14px Lato,system-ui,sans-serif;pointer-events:none}';document.head.appendChild(st)}
    var w=document.createElement('div');w.id='hhfsp';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-label','Sign full screen');
    w.innerHTML='<div class="hhf-in"><canvas></canvas><div class="hhf-ln"></div><span class="hhf-ph">Sign here</span><span class="hhf-who">'+String(opts.title||'Your signature').replace(/[&<>"]/g,'')+'</span><div class="hhf-bar"><button type="button" data-f="clear">Clear</button><button type="button" data-f="cancel">Cancel</button><button type="button" class="pri" data-f="done">Done</button></div></div>';
    document.body.appendChild(w);var inr=w.querySelector('.hhf-in'),cv=w.querySelector('canvas'),ph=w.querySelector('.hhf-ph'),ctx,down=false,last=null,drawn=false,prevOv=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
    var mode=false;function isLand(){return window.innerWidth>window.innerHeight}
    /* 3.53: if the screen itself is sideways (a phone that can't be locked), the box lies flat instead of turned */
    function setup(){mode=isLand();if(mode){inr.style.transform='none';inr.style.top='0';inr.style.left='0';inr.style.width=window.innerWidth+'px';inr.style.height=window.innerHeight+'px'}else{inr.style.transform='';inr.style.top='';inr.style.left='';inr.style.width=window.innerHeight+'px';inr.style.height=window.innerWidth+'px'}var d=window.devicePixelRatio||1,W=inr.offsetWidth,Hh=inr.offsetHeight;cv.width=Math.round(W*d);cv.height=Math.round(Hh*d);ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=3.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#14181D';ctx.fillStyle='#14181D';drawn=false;ph.hidden=false}
    // the box is turned 90 degrees clockwise: screen down is the box's "right", screen left is the box's "down"
    function pt(e){var r=inr.getBoundingClientRect();return mode?{x:e.clientX-r.left,y:e.clientY-r.top}:{x:e.clientY-r.top,y:r.right-e.clientX}}
    /* when the screen changes size or turns, rebuild the box and put back what was drawn */
    var rzT=0;function onRz(){clearTimeout(rzT);rzT=setTimeout(function(){try{if(!document.body.contains(w))return;var png=drawn?H.trimPng(cv):null;setup();if(png){var im=new Image();im.onload=function(){var W=inr.offsetWidth,Hh=inr.offsetHeight,sc=Math.min((W-24)/im.width,(Hh-24)/im.height,1.6),a=im.width*sc,b=im.height*sc;ctx.drawImage(im,(W-a)/2,(Hh-b)/2,a,b);drawn=true;ph.hidden=true};im.src=png}}catch(x){}},200)}
    window.addEventListener('resize',onRz);
    /* Android: go full screen and lock the screen upright while signing (iPhones do not allow this) */
    var fsDid=false,lkDid=false;
    try{var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),sa=window.matchMedia('(display-mode: standalone)').matches,coarse=window.matchMedia('(pointer: coarse)').matches;
      if(!ios&&coarse&&screen.orientation&&screen.orientation.lock){
        if(sa){screen.orientation.lock('portrait-primary').then(function(){lkDid=true}).catch(function(){})}
        else if(document.fullscreenEnabled&&!document.fullscreenElement&&document.documentElement.requestFullscreen){document.documentElement.requestFullscreen({navigationUI:'hide'}).then(function(){fsDid=true;return screen.orientation.lock('portrait-primary').then(function(){lkDid=true})}).catch(function(){})}
      }}catch(x){}
    cv.addEventListener('pointerdown',function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}down=true;last=pt(e);ctx.beginPath();ctx.arc(last.x,last.y,1.5,0,Math.PI*2);ctx.fill();drawn=true;ph.hidden=true});
    cv.addEventListener('pointermove',function(e){if(!down)return;var p=pt(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p});
    ['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(){down=false})});
    function close(){document.documentElement.style.overflow=prevOv;window.removeEventListener('resize',onRz);w.remove();
      try{if(lkDid&&screen.orientation&&screen.orientation.unlock&&!window.matchMedia('(display-mode: standalone)').matches)screen.orientation.unlock()}catch(x){}
      try{if(fsDid&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){})}catch(x){}}
    w.addEventListener('click',function(e){var b=e.target.closest('button[data-f]');if(!b)return;var f=b.dataset.f;
      if(f==='clear'){setup();return}if(f==='cancel'){close();if(opts.onCancel)opts.onCancel();return}
      if(f==='done'){if(!drawn){alert('Sign in the white area first.');return}var png=H.trimPng(cv);close();if(png&&opts.onDone)opts.onDone(png)}});
    setup();return {close:close}};
  window.HHSign=H;
})();
