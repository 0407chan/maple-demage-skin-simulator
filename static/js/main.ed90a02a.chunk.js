(this["webpackJsonpmaple-demage-skin-simulator"]=this["webpackJsonpmaple-demage-skin-simulator"]||[]).push([[0],{237:function(e,n,a){},239:function(e,n,a){"use strict";a.r(n);a(127);var t,r,i,c,s,u,o,d,m,b=a(0),l=a.n(b),p=a(22),g=a.n(p),f=a(39),j=a(118),k=a(40),y=a(74),N=a.n(y),O=a(117),h=a.n(O),v=a(246),x=a(19),w=a.n(x),T=a(41),S=a(62),C=a.n(S),M=function(){var e=Object(T.a)(w.a.mark((function e(n){var a;return w.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.a.get("https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/".concat(n.skinNumber,"/").concat(n.skinType,"/").concat(n.damageNumber));case 2:return a=e.sent,e.abrupt("return",a.data);case 4:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}(),D=function(e){return Object(f.useQuery)(["getDamageSkin",e],Object(T.a)(w.a.mark((function n(){return w.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.abrupt("return",M(e));case 1:case"end":return n.stop()}}),n)}))),{enabled:void 0!==e.skinNumber,retry:!1,keepPreviousData:!1,refetchOnWindowFocus:!1})},E=function(){var e=Object(T.a)(w.a.mark((function e(n){var a;return w.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.a.get("https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/".concat(n.skinNumber,"/").concat(n.skinType));case 2:return a=e.sent,e.abrupt("return",a.data);case 4:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}(),L=a(23),Q=a(24),R=Q.a.div(t||(t=Object(L.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 100%;\n"]))),z=(Q.a.div(r||(r=Object(L.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 200px;\n"]))),Q.a.div(i||(i=Object(L.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  gap: 20px;\n  width: 100%;\n  height: 100%;\n"])))),I=(Q.a.span(c||(c=Object(L.a)(["\n  color: #eeeeee;\n  font-size: 18px;\n  font-weight: bold;\n"]))),Q.a.img(s||(s=Object(L.a)(["\n  cursor: pointer;\n"])))),K=function(e){var n=e.skinNumber,a=e.skinType;return{damage0:D({skinNumber:n,skinType:a,damageNumber:"0"}),damage1:D({skinNumber:n,skinType:a,damageNumber:"1"}),damage2:D({skinNumber:n,skinType:a,damageNumber:"2"}),damage3:D({skinNumber:n,skinType:a,damageNumber:"3"}),damage4:D({skinNumber:n,skinType:a,damageNumber:"4"}),damage5:D({skinNumber:n,skinType:a,damageNumber:"5"}),damage6:D({skinNumber:n,skinType:a,damageNumber:"6"}),damage7:D({skinNumber:n,skinType:a,damageNumber:"7"}),damage8:D({skinNumber:n,skinType:a,damageNumber:"8"}),damage9:D({skinNumber:n,skinType:a,damageNumber:"9"}),numberSpace:D({skinNumber:n,skinType:a,damageNumber:"numberSpace"}),guard:D({skinNumber:n,skinType:"NoRed0",damageNumber:"guard"}),Miss:D({skinNumber:n,skinType:"NoRed0",damageNumber:"Miss"}),resist:D({skinNumber:n,skinType:"NoRed0",damageNumber:"resist"}),criEffect:D({skinNumber:n,skinType:"NoCri1",damageNumber:"Effect3"})}},P=Object(Q.b)(u||(u=Object(L.a)(["\n  0% {\n    transform: translateY(0px);\n    opacity: 1;\n  }\n\n  50%{\n    transform: translateY(-40px);\n    opacity: 1;\n  }\n\n  100% {\n    opacity: 0;\n    transform: translateY(-80px);\n  }\n"]))),Y=Q.a.div(o||(o=Object(L.a)(["\n  display: flex;\n  position: absolute;\n  opacity: 0;\n  animation: "," 1s linear;\n"])),P),F=Q.a.div(d||(d=Object(L.a)(["\n  display: flex;\n"]))),J=a(8),W=function(e){var n=e.skinNumber,a=e.damageItem,t=e.setDamageList,r=Object(b.useState)(999),i=Object(k.a)(r,2),c=i[0],s=(i[1],Object(b.useState)(!0)),u=Object(k.a)(s,2),o=u[0],d=u[1],m=K({skinNumber:n,skinType:a.isCritical?"NoCri1":"NoRed1"}),l=(m.Miss,m.criEffect),p=m.damage0,g=m.damage1,f=m.damage2,j=m.damage3,y=m.damage4,N=m.damage5,O=m.damage6,h=m.damage7,v=m.damage8,x=m.damage9,w=(m.guard,m.numberSpace),T=(m.resist,function(e){switch(e){case 0:return p;case 1:return g;case 2:return f;case 3:return j;case 4:return y;case 5:return N;case 6:return O;case 7:return h;case 8:return v;case 9:default:return x}}),S=function(e){var n,a,t;return e.data&&e.data.value&&""!==e.data.value?Object(J.jsx)("img",{style:{display:"flex",width:"fit-content",marginLeft:void 0!==(null===(n=w.data)||void 0===n?void 0:n.value)&&Number(null===(a=w.data)||void 0===a?void 0:a.value)<0?Number(null===(t=w.data)||void 0===t?void 0:t.value):void 0},src:"data:image/png;base64,".concat(e.data.value)}):null};return Object(b.useEffect)((function(){setTimeout((function(){t((function(e){return e.filter((function(e){return e.id!==a.id}))})),d(!1)}),c)}),[]),o?Object(J.jsxs)(Y,{children:[a.isCritical&&Object(J.jsxs)(F,{children:[S(l)," "]}),"".concat(a.damage).split("").map((function(e,n){return Object(J.jsxs)("div",{children:[S(T(Number(e)))," "]},n)}))]}):null},A=Q.a.div(m||(m=Object(L.a)(["\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  width: 100%;\n  gap: 16px;\n\n  ","\n"])),(function(e){return void 0!==e.gap&&{gap:e.gap}})),B=function(e){var n=e.gap,a=e.style,t=e.children;return Object(J.jsx)(A,{gap:n,style:a,children:void 0!==n&&n<0?Object(J.jsx)("div",{style:{marginLeft:n},children:t}):t})},q=function(){var e,n=Object(b.useState)(200),a=Object(k.a)(n,2),t=a[0],r=a[1],i=Object(b.useState)("NoCri1"),c=Object(k.a)(i,2),s=c[0],u=(c[1],Object(b.useState)([])),o=Object(k.a)(u,2),d=o[0],m=o[1],l=(e={skinNumber:t,skinType:s},Object(f.useQuery)(["getDamageSkinAll",e],Object(T.a)(w.a.mark((function n(){return w.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.abrupt("return",E(e));case 1:case"end":return n.stop()}}),n)}))),{enabled:void 0!==e.skinNumber,retry:!1,keepPreviousData:!0,refetchOnWindowFocus:!1}));Object(b.useEffect)((function(){var e;console.log(null===(e=l.data)||void 0===e?void 0:e.children)}),[l.data]);function p(e,n){return e=Math.ceil(e),n=Math.floor(n),Math.floor(Math.random()*(n-e))+e}return Object(J.jsxs)(R,{children:[Object(J.jsxs)(B,{style:{margin:"60px 0",justifyContent:"center"},children:[Object(J.jsx)(N.a,{disabled:1===t,onClick:function(){return r(t-1)},children:"-"}),Object(J.jsx)(h.a,{value:t,onChange:function(e){return r(e)}}),Object(J.jsx)(N.a,{onClick:function(){return r(t+1)},children:"+"})]}),Object(J.jsxs)(z,{children:[Object(J.jsx)(B,{style:{justifyContent:"center"},children:d.map((function(e){return Object(J.jsx)(W,{damageItem:e,setDamageList:m,skinNumber:t},e.id)}))}),Object(J.jsx)(I,{className:"no-drag",src:"https://maplestory.io/api/KMS/356/mob/100004/render/stand",alt:"orange-mushroom",onClick:function(){return function(){var e={id:Object(v.a)(),skinNumber:t,damage:p(1e5,4e5),isCritical:100*Math.random()<60};m([].concat(Object(j.a)(d),[e]))}()}})]})]})},G=(a(237),new f.QueryClient);g.a.render(Object(J.jsx)(l.a.StrictMode,{children:Object(J.jsx)(f.QueryClientProvider,{client:G,children:Object(J.jsx)(q,{})})}),document.getElementById("root"))}},[[239,1,2]]]);