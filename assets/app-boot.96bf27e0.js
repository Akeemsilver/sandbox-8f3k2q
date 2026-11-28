
 
window.HHSL_STANDALONE=true;
(function(){
  var CFG=((window.HHSL_ENV&&window.HHSL_ENV.live===true)?{apiKey:["AI","zaSyDc0-","e5mC8hU2","VkLUo92B","Q3BOIa9D","0a2dY"].join(""),authDomain:"hhsl-ert-roster.firebaseapp.com",projectId:"hhsl-ert-roster",storageBucket:"hhsl-ert-roster.firebasestorage.app",messagingSenderId:"473033435196",appId:"1:473033435196:web:28cb80ad0b9e14596c7b39"}:{apiKey:["AI","zaSyC_Iw","pT1Ufucl","PZLzU2M7","-Arb-Lry3","4Ux8"].join(""),authDomain:"hhsl-ert-roster-staging.firebaseapp.com",projectId:"hhsl-ert-roster-staging",storageBucket:"hhsl-ert-roster-staging.firebasestorage.app",messagingSenderId:"626932476096",appId:"1:626932476096:web:c859fc192809eb2055a525"});try{if(window.HHSL_ENV)window.HHSL_ENV.project=CFG.projectId}catch(e){}
  var OWNER_SHA='a6e155fd3967ccd8'+'0d193954b220ff90'+'42a04c89f14df252'+'0e6da5d84c78612e';
  function sha256(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(buf){return Array.prototype.map.call(new Uint8Array(buf),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')})}
  function g(id){return document.getElementById(id)}
  var __v500su=(function(){try{var q=new URLSearchParams(location.search);return q.get('signup')==='ert'?{e:String(q.get('email')||'').trim().toLowerCase(),done:0}:null}catch(e){return null}})();
  function gate(state,msg){if(state==='login'&&__v500su&&!__v500su.done){__v500su.done=1;state='ert';try{var _e5=g('ag-ert-email');if(_e5&&__v500su.e)_e5.value=__v500su.e}catch(e){}}
    var box=g('auth-gate');
    if(state==='open'){box.hidden=true;return}
    box.hidden=false;
    g('ag-checking').hidden=state!=='checking';
    g('ag-form').hidden=state!=='login';
    g('ag-noaccess').hidden=state!=='noaccess';
    var ef=g('ag-ert');if(ef)ef.hidden=state!=='ert';var vf=g('ag-verify');if(vf)vf.hidden=state!=='verify';
    var sf=g('ag-set');if(sf)sf.hidden=state!=='set';
    if(state==='noaccess')g('ag-nmsg').textContent=msg||'';
  }
  function say(t,ok){var m=g('ag-msg');m.textContent=t||'';m.className='ag-msg'+(ok?' ok':'')}
  function niceError(e){
    var c=e&&e.code;
    if(c==='auth/invalid-credential'||c==='auth/wrong-password'||c==='auth/user-not-found'||c==='auth/invalid-login-credentials')return 'That email or password is not right.';
    if(c==='auth/invalid-email')return 'Enter a valid email address.';
    if(c==='auth/too-many-requests')return 'Too many tries. Wait a few minutes, or reset your password.';
    if(c==='auth/network-request-failed')return 'No connection. Check your signal and try again.';
    if(c==='auth/user-disabled')return 'This account has been turned off.';
    return 'Could not sign in. Try again.';
  }
  var auth=null,fdb=null,ctx=null,resolveReady,ready=new Promise(function(r){resolveReady=r});
  var INST=(function(){try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: window-controls-overlay)').matches||matchMedia('(display-mode: minimal-ui)').matches||navigator.standalone===true||String(document.referrer).indexOf('android-app://')===0}catch(e){return false}})();
  window.HHSL_INSTALLED=INST;
  var IDLE_MS=15*60*1000,SESS='hhsl_sess',ALIVE='hhsl_alive',LAST='hhsl_lastact';
  function sget(k){try{return sessionStorage.getItem(k)}catch(e){return null}}function sset(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
  function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}function lset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  try{
    firebase.initializeApp(CFG);auth=firebase.auth();fdb=firebase.firestore();
    try{fdb.settings({ignoreUndefinedProperties:true})}catch(e){}
    if(INST){try{fdb.enablePersistence({synchronizeTabs:true}).catch(function(){})}catch(e){}}
  }catch(e){gate('noaccess','The app could not start. Check your connection and reload.');return}
  function nameFrom(email){var s=String(email||'').split('@')[0].split(/[._\-0-9]/)[0]||'';return s?s.charAt(0).toUpperCase()+s.slice(1):'You'}
  function avatar(name){
    var ch=(name||'?').charAt(0).toUpperCase();
    return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#14506B"/><text x="32" y="43" font-size="30" font-family="Arial" text-anchor="middle" fill="#fff">'+ch+'</text></svg>');
  }
  function finish(u,email,role,nm,pl,sl,dl,rt,eid,hr,du,acc){
    var name=nm||nameFrom(email);acc=acc||{};var vo=false;if(role==='edit')role='staff';else if(role==='view'){role='staff';vo=true}if(role==='staff'&&acc.viewOnly===true)vo=true;if(role==='director')vo=true;
    var PK={profiles:'pProfiles',del:'pDelete',ertHours:'pErtHours',upd:'pUpdates',ertAcc:'pErtAcc',erLock:'pErLock',pay:'pPay',hist:'pHist',ctr:'pCtr'},perms={};Object.keys(PK).forEach(function(k){perms[k]=(role==='owner'||role==='exec')||(k==='pay'?(role!=='ert'&&acc.pPay===true&&acc.pPayV===1):k==='ctr'?(role!=='ert'&&acc.pCtr===true):((role==='admin'||role==='dadmin')&&acc[PK[k]]===true))});
    ctx={lv:(role==='owner'||role==='exec')?'edit':(acc&&('leave' in acc))?((acc.leave==='edit'||acc.leave==='view')?acc.leave:'none'):'legacy',ertId:eid||'',uid:u.uid,email:email,role:role,name:name,avatar:avatar(name),pl:(role==='owner'||role==='exec')?'edit':role==='director'?'view':(pl==='edit'||pl==='view'?pl:'none'),sl:(role==='owner'||role==='exec')?'edit':role==='director'?'view':(sl==='edit'||sl==='view'?sl:'none'),dl:(role==='owner'||role==='exec'||(role==='director'||((role==='admin'||role==='dadmin')&&dl===true&&(!du||String(du)>=new Date().toISOString().slice(0,10))))),rt:(role==='owner'||role==='exec'||((role==='admin'||role==='dadmin')&&rt===true)),hr:(role==='owner'||role==='exec'||((role==='admin'||role==='dadmin')&&hr===true)),vo:vo,perms:perms,sections:(Array.isArray(acc.sections)?acc.sections.filter(function(x){return typeof x==='string'}).slice(0,10):[]),needSection:acc.needSection===true,deptRoles:(acc.deptRoles&&typeof acc.deptRoles==='object')?acc.deptRoles:{}};
    gate('open');resolveReady();
  }
   
  var AP=new URLSearchParams(location.search),AMODE=AP.get('mode'),ACODE=AP.get('oobCode'),actionBusy=!!(AMODE&&ACODE),actionEmail='';
  function clearAction(){actionBusy=false;try{history.replaceState(null,'',location.pathname)}catch(e){}}
  function setSay(t,ok){var m=g('ag-set-msg');if(m){m.textContent=t||'';m.className='ag-msg'+(ok?' ok':'')}}
  if(actionBusy&&AMODE==='resetPassword'){
    gate('set');g('ag-set-go').disabled=true;setSay('Checking your link\u2026',true);
    auth.verifyPasswordResetCode(ACODE).then(function(em){actionEmail=em;g('ag-set-email').value=em;g('ag-set-go').disabled=false;setSay('');setTimeout(function(){var p=g('ag-set-p1');if(p)p.focus()},50)})
      .catch(function(){g('ag-set-go').disabled=true;setSay('This link has expired or has already been used. Ask whoever manages the app to resend your invite, or tap "Go to sign in instead" and use Forgot password.')});
  }else if(actionBusy&&(AMODE==='verifyEmail'||AMODE==='recoverEmail')){
    auth.applyActionCode(ACODE).then(function(){clearAction();say(AMODE==='verifyEmail'?'Email confirmed. You can sign in.':'Your email address has been restored. You can sign in.',true)}).catch(function(){clearAction();say('That link has expired or has already been used.')}).then(function(){if(!auth.currentUser)gate('login')});
  }else if(actionBusy){clearAction()}
  if(g('ag-set')){
    g('ag-set-show').addEventListener('change',function(){var t=this.checked?'text':'password';g('ag-set-p1').type=t;g('ag-set-p2').type=t});
    g('ag-set-cancel').addEventListener('click',function(){clearAction();if(auth.currentUser)location.reload();else gate('login')});
    g('ag-set').addEventListener('submit',function(ev){
      ev.preventDefault();setSay('');
      var p1=g('ag-set-p1').value,p2=g('ag-set-p2').value;
      if(p1.length<8){setSay('Use at least 8 characters.');return}
      if(p1!==p2){setSay('The two passwords are not the same.');return}
      var b=g('ag-set-go');b.disabled=true;b.textContent='Saving\u2026';
      auth.confirmPasswordReset(ACODE,p1).then(function(){setSay('Password saved. Opening the app\u2026',true);clearAction();return auth.signInWithEmailAndPassword(actionEmail,p1)})
        .catch(function(e){b.disabled=false;b.textContent='Save password and open the app';var c=e&&e.code;setSay(c==='auth/weak-password'?'That password is too weak. Try a longer one.':c==='auth/expired-action-code'||c==='auth/invalid-action-code'?'This link has expired or has already been used. Ask for a new invite, or use Forgot password.':'Could not save the password. Check your signal and try again.')});
    });
  }
  function browserOut(why){try{location.hash='signedout-'+why}catch(e){}if(window.HHSL_signOut)window.HHSL_signOut();else auth.signOut().then(function(){location.reload()})}
  try{localStorage.removeItem('hhsl_public')}catch(e){}
  function idleMs(){return IDLE_MS}
  // Version 8.2: a browser session only continues after a refresh, a deliberate trip away (Back within 10 minutes),
  // or while another HHSL Command tab is really open. Reopening a closed tab signs out.
  var TABS='hhsl_tabs',TAB_ID=Math.random().toString(36).slice(2,10),LEFT='hhsl_left',SIGNING='hhsl_signing',TAB_LIVE=10*1000,LEFT_OK=10*60*1000;
  function srem(k){try{sessionStorage.removeItem(k)}catch(e){}}
  function tabsGet(){try{return JSON.parse(localStorage.getItem(TABS)||'{}')||{}}catch(e){return {}}}
  function tabsBeat(){var t=tabsGet(),n=Date.now();Object.keys(t).forEach(function(k){if(n-t[k]>60000)delete t[k]});t[TAB_ID]=n;lset(TABS,JSON.stringify(t))}
  function tabsBye(){var t=tabsGet();delete t[TAB_ID];lset(TABS,JSON.stringify(t))}
  function otherTabLive(){var t=tabsGet(),n=Date.now();return Object.keys(t).some(function(k){return k!==TAB_ID&&n-t[k]<TAB_LIVE})}
  function navType(){try{var e=performance.getEntriesByType('navigation')[0];if(e&&e.type)return e.type}catch(x){}try{return performance.navigation&&performance.navigation.type===1?'reload':'navigate'}catch(x){return 'navigate'}}
  window.HHSL_leaving=function(){if(!INST)sset(LEFT,String(Date.now()))};
  function browserCheck(u){
    if(INST||!u)return false;var now=Date.now(),li=Date.parse((u.metadata&&u.metadata.lastSignInTime)||'')||0;
    function ok(){sset(SESS,'1');tabsBeat();return false}
    if(sget(SIGNING)){srem(SIGNING);if(!li||now-li<5*60*1000){lset(LAST,String(now));return ok()}}
    if(!li)return ok();
    var la=+lget(LAST)||li;if(now-la>idleMs()){browserOut('idle');return true}
    if(sget(SESS)&&navType()==='reload')return ok();
    var left=+sget(LEFT)||0;if(left){srem(LEFT);if(sget(SESS)&&now-left<LEFT_OK)return ok()}
    if(otherTabLive())return ok();
    browserOut('closed');return true}
  if(!INST){
    var lastW=0;function act(){var n=Date.now();if(n-lastW>20000){lastW=n;lset(LAST,String(n))}}
    ['pointerdown','keydown','touchstart','wheel'].forEach(function(ev){document.addEventListener(ev,act,{passive:true,capture:true})});
    setInterval(function(){if(auth&&auth.currentUser&&sget(SESS))tabsBeat()},4000);
    window.addEventListener('pagehide',function(){tabsBye()});
    window.addEventListener('pageshow',function(e){if(e&&e.persisted&&auth&&auth.currentUser&&sget(SESS))tabsBeat()});
    document.addEventListener('submit',function(e){if(e.target&&e.target.closest&&e.target.closest('#auth-gate'))sset(SIGNING,'1')},true);
    // links to other websites open in a new tab, so the app tab never leaves the app
    document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||a.hasAttribute('download'))return;var h=a.getAttribute('href')||'';if(/^(mailto|tel|sms|javascript):|^#/i.test(h))return;var url;try{url=new URL(a.href,location.href)}catch(x){return}if(url.origin===location.origin||!/^https?:$/.test(url.protocol))return;if(!a.target||a.target==='_self'){a.target='_blank';a.rel='noopener'}},true);
    function idleCheck(){if(!(auth&&auth.currentUser))return;var la=+lget(LAST)||Date.now();if(Date.now()-la>idleMs())browserOut('idle')}
    setInterval(idleCheck,60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)idleCheck()});window.addEventListener('focus',idleCheck);
  }
  auth.onAuthStateChanged(function(u){
    if(actionBusy)return;
    if(!u){ctx=null;gate('login');return}
    if(browserCheck(u))return;
    gate('checking');
    var email=String(u.email||'').toLowerCase();
    sha256(email).then(function(hh){
      if(hh===OWNER_SHA){finish(u,email,'owner',null);return}
      var flow0=false;try{flow0=(sessionStorage.getItem('hhsl_hs_flow')==='1'||localStorage.getItem('hhsl_hs_flow')==='1')}catch(e){}return fdb.doc('access/'+email).get().then(function(s0){var d0=s0.exists?s0.data():null,quick=!flow0&&d0&&d0.needSetup!==true&&(d0.role==='exec'||d0.role==='admin'||d0.role==='staff'||d0.role==='edit'||d0.role==='view'||d0.role==='director'||d0.role==='dadmin');return (!quick&&window.HHSL_SETUP&&window.HHSL_SETUP.route?window.HHSL_SETUP.route(u,email).catch(function(){return false}):Promise.resolve(false)).then(function(took){if(took)return;return Promise.resolve(s0).then(function(s){
        var d=s.exists?s.data():null;
        if(d&&(d.role==='exec'||d.role==='admin'||d.role==='staff'||d.role==='edit'||d.role==='view'||d.role==='director'||d.role==='dadmin'))finish(u,email,d.role,d.name,d.proposals,d.staff,d.download,d.rates,'',d.hours,d.downloadUntil,d);
        else return fdb.doc('ertok/'+email).get().then(function(ok){
          if(!ok.exists){gate('noaccess','You are signed in as '+email+', but that email has not been given access yet. If you are an ERT, ask the office to save this email on your roster profile.');try{var hc=g('ag-hs-cont');if(hc)hc.hidden=!(u.emailVerified&&window.HHSL_SETUP&&window.HHSL_SETUP.resumeNow)}catch(e){}return}
          if(ok.data()&&ok.data().removed){gate('noaccess','This account has been removed by the office. Contact them if you think this is a mistake.');return}
          if(ok.data()&&ok.data().blocked){gate('noaccess','Your ERT account has been switched off by the office. Contact them if you think this is a mistake.');return}
          if(!u.emailVerified){showVerify(u,email);return}
          return fdb.doc('ertlink/'+email).get().then(function(l){var ld=l.exists?l.data():null;if(ld&&ld.ertId)finish(u,email,'ert',ld.name||null,null,null,false,false,ld.ertId);else gate('noaccess','Your email is on the roster, but your account could not be linked yet. Try again later or contact the office.')});
        });
      })})});
    }).catch(function(){gate('noaccess','Could not check your access. Check your signal and reload.')});
  });
  g('ag-form').addEventListener('submit',function(ev){
    ev.preventDefault();say('');
    var b=g('ag-go');b.disabled=true;b.textContent='Signing in';
    auth.signInWithEmailAndPassword(g('ag-email').value.trim(),g('ag-pass').value).catch(function(e){say(niceError(e))}).then(function(){b.disabled=false;b.textContent='Sign in'});
  });
  g('ag-forgot').addEventListener('click',function(){
    var em=g('ag-email').value.trim();
    if(!em){say('Type your email first, then tap Forgot password.');return}
    auth.sendPasswordResetEmail(em).then(function(){say('If that email has an account, a reset link is on its way. Check your inbox and spam.',true)}).catch(function(e){say(niceError(e))});
  });
  g('ag-out').addEventListener('click',function(){window.HHSL_signOut?window.HHSL_signOut():auth.signOut().then(function(){location.reload()})});var hsc=g('ag-hs-cont');if(hsc)hsc.addEventListener('click',function(){window.HHSL_SETUP&&window.HHSL_SETUP.resumeNow&&window.HHSL_SETUP.resumeNow()});
   
  var BACK=location.origin+location.pathname.replace(/index\.html$/,'');
  function ertSay(t,ok){var m=g('ag-ert-msg');if(m){m.textContent=t||'';m.className='ag-msg'+(ok?' ok':'')}}
  g('ag-ert-open').addEventListener('click',function(){ertSay('');g('ag-ert-email').value=g('ag-email').value.trim();gate('ert')});
  g('ag-ert-back').addEventListener('click',function(){gate('login')});
  g('ag-ert').addEventListener('submit',async function(ev){
    ev.preventDefault();ertSay('');var em=g('ag-ert-email').value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ertSay('Enter the email saved on your HHSL profile.');return}
    var b=g('ag-ert-go');b.disabled=true;b.textContent='Checking\u2026';
    try{
      var ok=await fdb.doc('ertok/'+em).get();
      if(!ok.exists){ertSay('We couldn\u2019t find this email on an HHSL profile. Ask the office to add it to your profile, then try again.');return}
      if(ok.data()&&ok.data().removed){ertSay('This email can\u2019t create an account. Contact the office.');return}
      if(ok.data()&&ok.data().blocked){ertSay('Your ERT account has been switched off by the office. Contact them if you think this is a mistake.');return}
      var pw='',bytes=crypto.getRandomValues(new Uint8Array(20));for(var i=0;i<bytes.length;i++)pw+=bytes[i].toString(36);pw+='Aa1!';
      var app2;try{app2=firebase.app('ertsignup')}catch(e){app2=firebase.initializeApp(CFG,'ertsignup')}
      try{await app2.auth().createUserWithEmailAndPassword(em,pw);try{await app2.auth().signOut()}catch(e){}}catch(e){if(!(e&&e.code==='auth/email-already-in-use'))throw e}
      try{await auth.sendPasswordResetEmail(em,{url:BACK})}catch(e){await auth.sendPasswordResetEmail(em)}
      ertSay('Done. Check your email (and spam) for "Reset your password for HHSL Command". Tap the link to create your HHSL Command password (your email does not change), then come back here and sign in.',true);
    }catch(e){ertSay(e&&e.code==='auth/network-request-failed'?'No connection. Check your signal and try again.':'Could not create your account. Try again, or contact the office.')}
    finally{b.disabled=false;b.textContent='Create my account'}
  });
  var verifySent=false;
  window.HHSL_emailVerified=function(){return !!(auth.currentUser&&auth.currentUser.emailVerified)};
  window.HHSL_sendVerify=function(){var u=auth.currentUser;if(!u)return Promise.reject(new Error('signed out'));return u.sendEmailVerification({url:BACK}).catch(function(){return u.sendEmailVerification()})};
  window.HHSL_recheckVerified=function(){var u=auth.currentUser;if(!u)return Promise.resolve(false);return u.reload().then(function(){return auth.currentUser.getIdToken(true)}).then(function(){return !!auth.currentUser.emailVerified})};
  function showVerify(u,email){
    gate('verify');g('ag-verify-email').textContent=email;
    if(!verifySent){verifySent=true;u.sendEmailVerification({url:BACK}).catch(function(){return u.sendEmailVerification()}).catch(function(){})}
  }
  g('ag-verify-again').addEventListener('click',function(){var u=auth.currentUser;if(!u)return;u.sendEmailVerification({url:BACK}).catch(function(){return u.sendEmailVerification()}).then(function(){g('ag-verify-msg').textContent='Sent again. Check your inbox and spam.'}).catch(function(){g('ag-verify-msg').textContent='Please wait a minute before sending again.'})});
  g('ag-verify-done').addEventListener('click',function(){var u=auth.currentUser;if(!u)return;u.reload().then(function(){return auth.currentUser.getIdToken(true)}).then(function(){if(auth.currentUser.emailVerified)location.reload();else g('ag-verify-msg').textContent='Not confirmed yet. Tap the link in the email first.'})});
  g('ag-verify-out').addEventListener('click',function(){window.HHSL_signOut?window.HHSL_signOut():auth.signOut().then(function(){location.reload()})});
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installEvt=e;if(window.HHSL_onInstallChange)window.HHSL_onInstallChange()});
  window.addEventListener('appinstalled',function(){window.__installEvt=null;window.__installed=true;if(window.HHSL_onInstallChange)window.HHSL_onInstallChange()});
  window.HHSL_invite=async function(email){
    var pw='',bytes=crypto.getRandomValues(new Uint8Array(20));
    for(var i=0;i<bytes.length;i++)pw+=bytes[i].toString(36);
    pw+='Aa1!';
    var app2;try{app2=firebase.app('invite')}catch(e){app2=firebase.initializeApp(CFG,'invite')}
    var created=true;
    try{await app2.auth().createUserWithEmailAndPassword(email,pw);try{await app2.auth().signOut()}catch(e){}}
    catch(e){if(e&&e.code==='auth/email-already-in-use')created=false;else throw e}
    var back=location.origin+location.pathname.replace(/index\.html$/,'');
    try{await auth.sendPasswordResetEmail(email,{url:back,handleCodeInApp:false})}
    catch(e){if(e&&/continue-uri|unauthorized|invalid-dynamic|missing-continue/.test(e.code||''))await auth.sendPasswordResetEmail(email);else throw e}
    return {created:created};
  };
  window.HHSL_lastSignIn=function(){try{return (auth.currentUser&&auth.currentUser.metadata&&auth.currentUser.metadata.lastSignInTime)||''}catch(e){return ''}};
  window.HHSL_getToken=function(){return auth.currentUser?auth.currentUser.getIdToken():Promise.reject(new Error('signed out'))};
  async function wipeLocal(){
    try{var keep={ert_theme:1,hhsl_dev:1,hhsl_devbk:1,hhsl_recent_emails:1};var ks=[];for(var i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));ks.forEach(function(k){if(!keep[k]&&!/^hhsl_(tip_|tour_|tipsoff_)/.test(k)&&k.indexOf('hhsl_devseen_')!==0&&k.indexOf('push_on_')!==0&&k.indexOf('hhsl_push_off_')!==0)localStorage.removeItem(k)})}catch(e){}
    try{sessionStorage.clear()}catch(e){}
    try{await fdb.terminate()}catch(e){}
    try{await fdb.clearPersistence()}catch(e){}
    try{if(indexedDB&&indexedDB.databases){var dbs=await indexedDB.databases();dbs.forEach(function(d){if(d&&d.name&&/^firestore\//.test(d.name))try{indexedDB.deleteDatabase(d.name)}catch(e){}})}}catch(e){}
  }
  async function signOutWipe(){try{await auth.signOut()}catch(e){}await wipeLocal();location.reload()}
  window.HHSL_signOut=function(){signOutWipe()};
  window.HHSL_canDownload=function(){return !!(ctx&&ctx.dl)};
  var DL={save:function(o){return new Promise(function(res,rej){
    var ok=(o&&o.kind&&window.HHSL_dlAllowed)?window.HHSL_dlAllowed(o.kind):!!(ctx&&ctx.dl);
    if(!ok){window.dispatchEvent(new Event('hhsl-nodl'));rej({code:'declined'});return}
    function doSave(){try{dlNote('start',o.filename)}catch(e){}Promise.resolve(window.HHSL_dlPrepare?window.HHSL_dlPrepare(o):o.data).then(function(data){
    try{var blob=(typeof Blob!=='undefined'&&data instanceof Blob)?data:new Blob([data]);
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=o.filename||'download';document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000);res({ok:true})}catch(e){rej(e)}},rej)}
    if(o.noAsk||o.kind==='crewimage'||!window.HHSL_dlAsk){doSave();return}
    window.HHSL_dlAsk(o).then(function(ch){if(ch==='download')doSave();else if(ch==='view')window.HHSL_viewFile(o,doSave,function(){rej({code:'declined'})});else rej({code:'declined'})});
  })}};
  var USER={
    isOwner:function(){return Promise.resolve(ctx.role==='owner')},
    isAdmin:function(){return Promise.resolve(ctx.role==='owner'||ctx.role==='exec'||ctx.role==='admin')},
    canEdit:function(){return Promise.resolve(ctx.role!=='view'&&ctx.role!=='ert'&&!ctx.vo)},
    can:function(n){return n==='data.write'?(ctx.role!=='view'&&ctx.role!=='ert'&&!ctx.vo):null},
    id:function(){return Promise.resolve(ctx.uid)},
    me:function(){return Promise.resolve({id:ctx.uid,name:ctx.name,avatarUrl:ctx.avatar,color:'#14506B',email:ctx.email,isOwner:ctx.role==='owner',isAdmin:ctx.role==='owner'||ctx.role==='exec'||ctx.role==='admin',isExec:ctx.role==='owner'||ctx.role==='exec',proposals:ctx.pl,staffAccess:ctx.sl,leaveAccess:ctx.lv,canDownload:ctx.dl,canRates:!!ctx.rt,canHours:!!ctx.hr,canEdit:ctx.role!=='view'&&ctx.role!=='ert'&&!ctx.vo,viewOnly:!!ctx.vo,level:ctx.role,perms:ctx.perms||{},isErt:ctx.role==='ert',ertId:ctx.ertId||'',sections:ctx.sections||[],needSection:!!ctx.needSection,isDirector:ctx.role==='director',deptRoles:ctx.deptRoles||{}})}
  };
  window.claude={use:function(name){
    if(name==='downloads')return Promise.resolve(DL);
    if(name==='user')return ready.then(function(){return USER});
    if(name==='db')return ready.then(function(){return fdb});
    return Promise.resolve(null);
  }};
})();
