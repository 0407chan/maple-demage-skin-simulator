(this["webpackJsonpmaple-demage-skin-simulator"]=this["webpackJsonpmaple-demage-skin-simulator"]||[]).push([[0],{231:function(e,n,t){},233:function(e,n,t){"use strict";t.r(n);t(123);var i,r,a,c,s,u=t(0),o=t.n(u),d=t(18),l=t.n(d),p=t(38),b=t(71),k=t(70),f=t.n(k),v=t(114),j=t.n(v),m=t(30),y=t.n(m),g=t(46),h=t(67),x=t.n(h),O=function(){var e=Object(g.a)(y.a.mark((function e(n){var t;return y.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,x.a.get("https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/".concat(n.skinId,"/").concat(n.skinType,"/").concat(n.skinNumber));case 2:return t=e.sent,e.abrupt("return",t.data);case 4:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}(),w=function(e){return Object(p.useQuery)(["getDemageSkin",e],Object(g.a)(y.a.mark((function n(){return y.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.abrupt("return",O(e));case 1:case"end":return n.stop()}}),n)}))),{enabled:void 0!==e.skinId,retry:!1,keepPreviousData:!0,refetchOnWindowFocus:!1})},N=function(){var e=Object(g.a)(y.a.mark((function e(n){var t;return y.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,x.a.get("https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/".concat(n.skinId,"/").concat(n.skinType));case 2:return t=e.sent,e.abrupt("return",t.data);case 4:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}(),I=t(34),T=t(35),S=T.a.div(i||(i=Object(I.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 100%;\n"]))),C=(T.a.div(r||(r=Object(I.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 200px;\n"]))),T.a.div(a||(a=Object(I.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 100%;\n"])))),D=T.a.span(c||(c=Object(I.a)(["\n  color: #eeeeee;\n  font-size: 18px;\n  font-weight: bold;\n"]))),E=T.a.div(s||(s=Object(I.a)(["\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  width: 100%;\n  gap: 16px;\n\n  ","\n"])),(function(e){return void 0!==e.gap&&{gap:e.gap}})),Q=t(9),z=function(e){var n=e.gap,t=e.style,i=e.children;return Object(Q.jsx)(E,{gap:n,style:t,children:void 0!==n&&n<0?Object(Q.jsx)("div",{style:{marginLeft:n},children:i}):i})},M=[{label:"\uc77c\ubc18",value:"NoRed1"},{label:"\ud06c\ub9ac\ud2f0\uceec",value:"NoCri1"}],P=function(){var e,n,t,i,r=Object(u.useState)(200),a=Object(b.a)(r,2),c=a[0],s=a[1],o=Object(u.useState)("NoCri1"),d=Object(b.a)(o,2),l=d[0],k=d[1],v=(i={skinId:c,skinType:l},Object(p.useQuery)(["getDemageSkinAll",i],Object(g.a)(y.a.mark((function e(){return y.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",N(i));case 1:case"end":return e.stop()}}),e)}))),{enabled:void 0!==i.skinId,retry:!1,keepPreviousData:!0,refetchOnWindowFocus:!1})),m=w({skinId:c,skinType:l,skinNumber:"0"}),h=w({skinId:c,skinType:l,skinNumber:"1"}),x=w({skinId:c,skinType:l,skinNumber:"2"}),O=w({skinId:c,skinType:l,skinNumber:"3"}),I=w({skinId:c,skinType:l,skinNumber:"4"}),T=w({skinId:c,skinType:l,skinNumber:"5"}),E=w({skinId:c,skinType:l,skinNumber:"6"}),P=w({skinId:c,skinType:l,skinNumber:"7"}),F=w({skinId:c,skinType:l,skinNumber:"8"}),J=w({skinId:c,skinType:l,skinNumber:"9"}),K=w({skinId:c,skinType:l,skinNumber:"Effect3"}),L=w({skinId:c,skinType:l,skinNumber:"numberSpace"});Object(u.useEffect)((function(){var e;console.log(null===(e=v.data)||void 0===e?void 0:e.children)}),[v.data]);var W=function(e){var n,t,i;return e.data&&e.data.value&&""!==e.data.value?Object(Q.jsx)("img",{style:{display:"flex",width:"fit-content",marginLeft:void 0!==(null===(n=L.data)||void 0===n?void 0:n.value)&&Number(null===(t=L.data)||void 0===t?void 0:t.value)<0?Number(null===(i=L.data)||void 0===i?void 0:i.value):void 0},src:"data:image/png;base64,".concat(e.data.value)}):null};return Object(Q.jsxs)(S,{children:[Object(Q.jsxs)(z,{style:{margin:"60px 0",justifyContent:"center"},children:[Object(Q.jsx)(f.a,{disabled:1===c,onClick:function(){return s(c-1)},children:"-"}),Object(Q.jsx)(D,{children:c}),Object(Q.jsx)(f.a,{onClick:function(){return s(c+1)},children:"+"})]}),Object(Q.jsx)(z,{style:{justifyContent:"center"},children:Object(Q.jsx)(j.a.Group,{options:M,value:l,buttonStyle:"solid",onChange:function(e){return k(e.target.value)}})}),Object(Q.jsx)(C,{children:Object(Q.jsxs)(z,{gap:void 0!==(null===(e=L.data)||void 0===e?void 0:e.value)&&Number(null===(n=L.data)||void 0===n?void 0:n.value)>0?Number(null===(t=L.data)||void 0===t?void 0:t.value):0,style:{justifyContent:"center"},children:[W(K),W(m),W(h),W(x),W(O),W(I),W(T),W(E),W(P),W(F),W(J)]})})]})},F=(t(231),new p.QueryClient);l.a.render(Object(Q.jsx)(o.a.StrictMode,{children:Object(Q.jsx)(p.QueryClientProvider,{client:F,children:Object(Q.jsx)(P,{})})}),document.getElementById("root"))}},[[233,1,2]]]);