(this["webpackJsonpmaple-demage-skin-simulator"]=this["webpackJsonpmaple-demage-skin-simulator"]||[]).push([[0],{815:function(n,e,t){},817:function(n,e,t){"use strict";t.r(e);t(364);var i,a,c,r,o,s,l,d,u,b,m,p,g,x,f,j,h,O,k,v,w,y,N,S,C,D,E,I,z,L,R,M,T,B,F,A=t(0),H=t.n(A),K=t(43),P=t.n(K),Q=t(102),Y=t(354),J=t(107),W=t(28),$=t(355),G=t(836),U=t(30),V=t(31),_=V.a.div(i||(i=Object(U.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 100%;\n"]))),q=V.a.div(a||(a=Object(U.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  width: 100%;\n  height: 60px;\n"]))),X=V.a.div(c||(c=Object(U.a)(["\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: #282c34;\n  gap: 20px;\n  width: 100%;\n  height: 100%;\n"]))),Z=(V.a.span(r||(r=Object(U.a)(["\n  color: #eeeeee;\n  font-size: 18px;\n  font-weight: bold;\n"]))),V.a.img(o||(o=Object(U.a)(["\n  cursor: pointer;\n"])))),nn=Object(V.b)(s||(s=Object(U.a)(["\n  0% {\n    transform: translateY(0px);\n    opacity: 1;\n  }\n\n  50%{\n    transform: translateY(-40px);\n    opacity: 1;\n  }\n\n  100% {\n    opacity: 0;\n    transform: translateY(-80px);\n  }\n"]))),en=V.a.div(l||(l=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  align-items: center;\n  opacity: 0;\n  animation: "," 1s linear;\n"])),nn),tn=V.a.div(d||(d=Object(U.a)(["\n  display: flex;\n"]))),an=t(16),cn=function(n){var e=n.damageItem,t=n.setDamageList,i=n.currentSkin,a=Object(A.useState)(1e3),c=Object(W.a)(a,1)[0],r=Object(A.useState)(!0),o=Object(W.a)(r,2),s=o[0],l=o[1],d=function(n){return e.isCritical?"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCri1-").concat(n,".png"):"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoRed1-").concat(n,".png")},u=function(n){return e.isCritical?"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCri0-").concat(n,".png"):"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoRed0-").concat(n,".png")};Object(A.useEffect)((function(){setTimeout((function(){t((function(n){return n.filter((function(n){return n.id!==e.id}))})),l(!1)}),c)}),[]);return s?Object(an.jsxs)(en,{className:"no-drag",children:[e.isCritical&&Object(an.jsx)(tn,{children:Object(an.jsx)("img",{draggable:!1,alt:"critical-img",src:"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCri1-effect3.png")})}),function(){if(null===i||void 0===i?void 0:i.name.includes("\uc720\ub2db")){var n="".concat(e.damage),t="";return n.length<=12&&n.length>8?(t+="".concat(n.slice(-12,-8),"\uc5b5"),Number(n.slice(-8,-4))>0&&(t+="".concat(n.slice(-8,-4),"\ub9cc")),Number(n.slice(-4))>0&&(t+="".concat(n.slice(-4)))):n.length<=8&&n.length>4?(t+="".concat(n.slice(-8,-4),"\ub9cc"),Number(n.slice(-4))>0&&(t+="".concat(n.slice(-4)))):t+="".concat(n.slice(-4)),t}return"".concat(e.damage)}().split("").map((function(n,t){return Object(an.jsx)("img",{style:{width:"fit-content",height:"fit-content",zIndex:t+1,marginBottom:t%2===0?4:0,marginTop:t%2===1?4:0},draggable:!1,alt:"skin-img-".concat(n,"-").concat(t),src:"\ub9cc"===n||"\uc5b5"===n?(i=n,e.isCritical?"\ub9cc"===i?"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCustom-NoCri1-3.png"):"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCustom-NoCri1-4.png"):"\ub9cc"===i?"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCustom-NoRed1-3.png"):"".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e.skinNumber,"-NoCustom-NoRed1-4.png")):0===t?d(Number(n)):u(Number(n))},t);var i}))]}):null},rn=t(32),on=t(101),sn=t(85),ln="#f6ffd0",dn="#bbd839",un="#7f9326",bn="#7c8261",mn="#616747",pn="#4d513f",gn=Object(V.a)(sn.Button)(u||(u=Object(U.a)(["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  border-radius: 6px;\n  flex-direction: row;\n  gap: 10px;\n  border: 1px solid ",";\n  color: ",";\n  font-weight: bold;\n  background-color: ",";\n  cursor: pointer;\n  transition: all 0.2s ease;\n  &:hover {\n    color: ",";\n    background-color: ",";\n    border: 1px solid ",";\n  }\n  &[disabled] {\n    color: ",";\n    background-color: ",";\n    border: 1px solid ",";\n    cursor: not-allowed;\n\n    img {\n      filter: grayscale(0.8);\n    }\n    &:hover {\n      color: ",";\n      background-color: ",";\n      border: 1px solid ",";\n      cursor: not-allowed;\n    }\n  }\n\n  &:focus {\n    color: ",";\n    background-color: ",";\n    border: 1px solid ",";\n  }\n"])),un,ln,"#aac632",ln,dn,un,bn,mn,pn,bn,mn,pn,ln,dn,un),xn=function(n){var e=n.disabled,t=Object(on.a)(n,["disabled"]);return Object(an.jsx)(gn,Object(rn.a)({disabled:e},t))},fn=V.a.div(b||(b=Object(U.a)(["\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  width: 100%;\n  gap: 16px;\n\n  ","\n"])),(function(n){return void 0!==n.gap&&{gap:n.gap}})),jn=function(n){var e=n.gap,t=n.style,i=n.children;return Object(an.jsx)(fn,{gap:e,style:t,children:void 0!==e&&e<0?Object(an.jsx)("div",{style:{marginLeft:e},children:i}):i})},hn=Object(V.a)(sn.Input)(m||(m=Object(U.a)(["\n  width: calc(100% - 30px);\n  background-color: #2b2b2bc7;\n  color: #f0f0f0;\n  border: 1px solid #4f3b11c6;\n  &:hover {\n    border: 1px solid #9a7320;\n  }\n  &:focus {\n    border: 1px solid #d5a130;\n  }\n  &:disabled {\n    background-color: #c8c8c8;\n  }\n  &::placeholder {\n    color: #808080;\n  }\n"]))),On=function(n){var e=n.disabled,t=Object(on.a)(n,["disabled"]);return Object(an.jsx)(hn,Object(rn.a)({disabled:e},t))},kn=function(){var n=Object(A.useState)({width:void 0,height:void 0}),e=Object(W.a)(n,2),t=e[0],i=e[1];Object(A.useEffect)((function(){function n(){i({width:window.innerWidth,height:window.innerHeight})}return window.addEventListener("resize",n),n(),function(){return window.removeEventListener("resize",n)}}),[]);return{windowSize:t,isMobile:function(){return t.width&&t.width<=500}}},vn=function(n){return null===n||void 0===n||""===n?"0":n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")},wn=V.a.div(p||(p=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  z-index: 4;\n  background-color: rgba(0, 0, 0, 0.3);\n  ","\n"])),(function(n){return n.isOpen?{visibility:"visible",opacity:1}:{visibility:"hidden",opacity:0}})),yn=V.a.div(g||(g=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  right: 20px;\n  top: 20px;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: rgba(60, 60, 60, 0.93);\n  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8);\n  border-radius: 5px;\n  border: 1px solid rgba(169, 169, 169, 0.9);\n  padding: 0 15px 15px 15px;\n  gap: 10px;\n  opacity: 0;\n  z-index: 8;\n  @media screen and (max-width: 500px) {\n    width: calc(100vw - 40px);\n    /* height: calc(100vh - 40px); */\n  }\n  width: 360px;\n  height: fit-content;\n  transition: all 0.3s ease;\n  ","\n"])),(function(n){return n.isOpen?{visibility:"visible",opacity:1}:{visibility:"hidden",opacity:0}})),Nn=V.a.div(x||(x=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  font-size: 15px;\n  border-top-left-radius: 5px;\n  border-top-right-radius: 5px;\n  align-items: center;\n  justify-content: center;\n  font-weight: bold;\n  color: #ffcc5f;\n  padding-top: 10px;\n  padding-bottom: 5px;\n"]))),Sn=V.a.div(f||(f=Object(U.a)(["\n  display: flex;\n  justify-content: flex-start;\n  flex-direction: column;\n  overflow-y: overlay;\n  gap: 4px;\n  width: 100%;\n  height: 100%;\n\n  /* width */\n  &::-webkit-scrollbar {\n    width: 10px;\n  }\n\n  /* Track */\n  &::-webkit-scrollbar-track {\n    background: unset;\n  }\n\n  /* Handle */\n  &::-webkit-scrollbar-thumb {\n    border-radius: 4px;\n    background: #777;\n  }\n\n  /* Handle on hover */\n  &::-webkit-scrollbar-thumb:hover {\n    background: #888;\n  }\n"]))),Cn=V.a.div(j||(j=Object(U.a)(["\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  gap: 12px;\n  border-radius: 5px;\n  padding: 10px;\n  background-color: #454444e7;\n"]))),Dn=(V.a.div(h||(h=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  align-items: center;\n  justify-content: center;\n"]))),Object(V.a)(sn.Button)(O||(O=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  top: 12px;\n  right: 15px;\n  width: 22px;\n  height: 22px;\n  font-weight: bold;\n  justify-content: center;\n  align-items: center;\n  border-radius: 5px !important;\n  background-color: #e6ae35;\n  color: #eeeeee;\n  font-weight: bolder;\n  border: unset;\n\n  &:hover {\n    color: #eeeeee;\n    background-color: #f4c04f;\n  }\n\n  &:active {\n    color: #eeeeee;\n    background-color: #e6ae35;\n  }\n  &:focus {\n    background-color: #c9982d;\n    color: #eeeeee;\n  }\n\n  .ex {\n    display: flex;\n    position: absolute;\n    left: 4;\n    width: 14px;\n    border-radius: 2px;\n    background-color: #eeeeee;\n    border: 2px solid #eeeeee;\n  }\n  .left {\n    transform: rotate(45deg);\n  }\n  .right {\n    transform: rotate(135deg);\n  }\n"])))),En=(Object(V.a)(sn.Input)(k||(k=Object(U.a)(["\n  width: calc(100% - 30px);\n  background-color: #2b2b2bc7;\n  color: #eeeeee;\n  border: 1px solid #4f3b11c6;\n  &:hover {\n    border: 1px solid #9a7320;\n  }\n  &:focus {\n    border: 1px solid #d5a130;\n  }\n  &:disabled {\n    background-color: #c8c8c8;\n  }\n"]))),V.a.span(v||(v=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  justify-content: center;\n  color: #eeeeee;\n"]))),V.a.div(w||(w=Object(U.a)(["\n  margin-left: 2px;\n  font-size: 1.2rem;\n  font-weight: bold;\n  color: #eeeeee;\n"])))),In=V.a.div(y||(y=Object(U.a)(["\n  display: flex;\n  width: 40%;\n  font-size: 0.9rem;\n  color: #cbcbcb;\n"]))),zn=15e10,Ln=function(n){var e=n.isOpen,t=n.onCancel,i=n.setting,a=n.setSetting,c=kn().isMobile,r=function(){t()};return Object(an.jsxs)(an.Fragment,{children:[c()&&Object(an.jsx)(wn,{isOpen:e,onClick:r}),Object(an.jsxs)(yn,{isOpen:e,children:[Object(an.jsx)(Nn,{children:"SETTING"}),Object(an.jsxs)(Dn,{size:"small",onClick:r,children:[Object(an.jsx)("div",{className:"ex left"}),Object(an.jsx)("div",{className:"ex right"})]}),Object(an.jsxs)(Sn,{children:[Object(an.jsx)(En,{children:"\ub370\ubbf8\uc9c0 \uc138\ud305"}),Object(an.jsxs)(Cn,{children:[Object(an.jsxs)(jn,{gap:16,children:[Object(an.jsx)(In,{children:"\ucd5c\ub300 \ub370\ubbf8\uc9c0"}),Object(an.jsx)(On,{maxLength:16,style:{width:"100%"},placeholder:"\ucd5c\ub300 \ub370\ubbf8\uc9c0\ub97c \uc785\ub825\ud558\uc138\uc694.",value:void 0!==i.maxDamage?vn(i.maxDamage):"",onChange:function(n){var e=n.target.value.replace(/[^0-9]/g,"").replaceAll(",",""),t="".concat(i.minDamage||0);0===Number(e)&&(e="".concat(1)),Number(e)<=(i.minDamage||0)&&(t=e),Number(e)>=zn&&(e="".concat(zn)),a(Object(rn.a)(Object(rn.a)({},i),{},{maxDamage:""!==e?Number(e):void 0,minDamage:Number(t)}))}})]}),Object(an.jsxs)(jn,{gap:16,children:[Object(an.jsx)(In,{children:"\ucd5c\uc18c \ub370\ubbf8\uc9c0"}),Object(an.jsx)(On,{maxLength:16,placeholder:"\ucd5c\uc18c \ub370\ubbf8\uc9c0\ub97c \uc785\ub825\ud558\uc138\uc694.",style:{width:"100%"},value:void 0!==i.minDamage?vn(i.minDamage):"",onChange:function(n){var e=n.target.value.replace(/[^0-9]/g,"").replaceAll(",",""),t="".concat(i.maxDamage||0);Number(e)>=zn&&(e="".concat(zn)),0===Number(e)&&(e="".concat(1)),Number(e)>=(i.maxDamage||0)&&(t=e),a(Object(rn.a)(Object(rn.a)({},i),{},{minDamage:""!==e?Number(e):void 0,maxDamage:Number(t)}))}})]})]})]}),Object(an.jsxs)(Sn,{style:{marginTop:8},children:[Object(an.jsx)(En,{children:"\ud06c\ub9ac\ud2f0\uceec \uc138\ud305"}),Object(an.jsx)(Cn,{children:Object(an.jsxs)(jn,{gap:16,children:[Object(an.jsx)(In,{children:"\ud06c\ub9ac\ud2f0\uceec \ud655\ub960"}),Object(an.jsx)(On,{maxLength:4,style:{width:"100%"},placeholder:"\ud06c\ub9ac\ud2f0\uceec \ud655\ub960\uc744 \uc785\ub825\ud558\uc138\uc694.",value:void 0!==i.criticalRate?vn(i.criticalRate):"",onChange:function(n){var e=n.target.value.replace(/[^0-9]/g,"").replaceAll(",","");Number(e)>=100&&(e="".concat(100)),a(Object(rn.a)(Object(rn.a)({},i),{},{criticalRate:""!==e?Number(e):void 0}))}})]})})]})]})]})},Rn=t(44),Mn=t.n(Rn),Tn=t(69),Bn=t(139),Fn=t.n(Bn),An=function(){var n=Object(Tn.a)(Mn.a.mark((function n(e){var t;return Mn.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,Fn.a.get("https://maplestory.io/api/KMS/352/item",{params:e});case 2:return t=n.sent,n.abrupt("return",t.data);case 4:case"end":return n.stop()}}),n)})));return function(e){return n.apply(this,arguments)}}(),Hn={2431965:208,2431966:1,2431967:2,2432131:3,2438162:3,2432153:4,2432154:5,2432207:6,2432354:7,2432355:8,2435173:8,2432465:9,2432479:10,2432526:11,2432532:12,2432592:13,2432640:14,2432710:15,2432836:16,2432973:17,2433063:18,2433178:20,2433456:21,2438180:22,2433715:23,2433804:24,5680343:25,2435025:26,2435026:27,2438186:28,2433990:29,2434248:34,2435028:35,2434274:36,2434289:37,2434390:38,2434391:39,2438194:40,2434528:41,2434529:42,2434530:43,2438198:44,2434574:45,2434575:46,2438201:47,2434654:48,2434661:50,2438205:51,313e4:51,2434734:52,2438207:53,2434950:74,2434951:75,2435030:76,2435043:77,2435044:78,2435046:79,2435047:80,2435140:81,2435141:82,2435179:83,2435162:84,2435157:85,2435158:86,2435159:87,2435160:88,2435161:89,2435182:90,2435166:91,2435184:92,2435222:93,2435293:94,2435313:95,2435331:96,2435332:97,2435333:98,2435334:99,2435316:100,2435408:101,2435427:102,2435428:103,2435429:104,2435456:105,2435493:106,2435461:106,2435424:109,2435425:110,2435431:111,2435430:112,2435432:113,2435433:114,2435516:115,2435521:116,2435522:117,2435523:118,2435524:119,2435538:120,2435832:121,2435833:122,2435839:123,2435840:124,2435841:125,2435972:127,2436023:128,2436024:129,2436026:130,2436027:131,2436028:132,2436029:133,2436045:134,2436085:135,2436083:136,2436084:137,2436103:138,2436131:139,2436140:140,2436206:141,2436182:142,2436212:143,2436215:144,2436268:145,2436258:146,2436259:147,2436400:148,2436437:149,2436521:150,2436528:152,2436529:153,2436522:154,2436553:155,2436560:156,2436578:157,2436611:158,2436612:159,2436596:160,2436679:161,2436680:162,2436681:163,2436682:164,2436683:165,2436684:166,2436785:167,2436810:168,2436951:169,2436952:170,2436953:171,2437022:172,2437023:173,2437024:174,2437009:175,2438301:175,2437164:176,2437238:177,2437243:178,2437239:179,2437495:180,2437496:181,2437498:182,2437515:183,2437482:184,2437691:185,2437716:186,2438312:186,2437735:187,2437736:188,2437854:189,2437877:190,2438143:191,2438144:192,2438352:193,2438378:194,2438379:195,2438413:196,2438415:197,2438417:198,2438419:199,2438460:200,2438491:201,2438529:202,2438637:203,2438672:204,2438676:205,2438880:206,2438884:207,2438871:208,2439256:209,2439264:210,2439265:211,2439277:212,2439381:213,2439392:214,2439394:215,2439407:216,2439572:217,2439616:218,2439652:219,2439683:221,2439685:222,2439768:223,2439925:224,2439927:225,2630104:226,2630132:227,2630010:228,2630178:229,2630213:230,2630380:231,2630235:232,2630224:233,2630262:234,2630264:235,2630266:236,2630384:237,2630421:239,5680688:238,2630435:240,2630477:241,2434655:49,2630479:242,2630481:243,2630483:244,2630485:245,2630552:246,2630554:247,2630556:248,2630558:249,2630560:250,2630652:251,2630743:252,2630745:253,2630747:254,2630749:255,2630751:256,2630753:257,2630780:258,2630969:259,2631090:260,2631091:261,2631097:262,2631134:263,2631189:264,2631183:265,2631401:266,2631451:267,2631471:268,2631492:269,2631610:270,3130001:271,2631797:273,2631814:274,2631884:275,2631892:276,2632123:277,2632281:278,2632287:279,2632348:280,2632429:281,2632452:282,2632497:283,2632711:284,5680862:285,2632815:286,2632888:287,2632975:288,2633045:289,2633047:290,2633073:291,2633218:292,2633220:293,2633305:294,2633312:295,2633556:296,2633573:297,2633598:298,2633699:299,2439396:1010,2439398:1017,2630268:1030,2438148:1287,2439681:1290,2438150:1302,2439400:1322,2630516:1343},Kn=V.a.div(N||(N=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  z-index: 10;\n  background-color: rgba(0, 0, 0, 0.3);\n  ","\n"])),(function(n){return n.isOpen?{visibility:"visible",opacity:1}:{visibility:"hidden",opacity:0}})),Pn=V.a.div(S||(S=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  left: 20px;\n  top: 20px;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: rgba(60, 60, 60, 0.93);\n  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8);\n  border-radius: 5px;\n  border: 1px solid rgba(169, 169, 169, 0.9);\n  gap: 10px;\n  opacity: 0;\n  z-index: 10;\n  @media screen and (max-width: 500px) {\n    width: calc(100vw - 40px);\n    height: calc(100vh - 40px);\n  }\n  width: 360px;\n  height: calc(100vh - 40px);\n  transition: all 0.3s ease;\n  ","\n"])),(function(n){return n.isOpen?{visibility:"visible",opacity:1}:{visibility:"hidden",opacity:0}})),Qn=V.a.div(C||(C=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  font-size: 15px;\n  border-top-left-radius: 5px;\n  border-top-right-radius: 5px;\n  align-items: center;\n  justify-content: center;\n  font-weight: bold;\n  color: #ffcc5f;\n  padding-top: 10px;\n  padding-bottom: 5px;\n"]))),Yn=V.a.div(D||(D=Object(U.a)(["\n  display: flex;\n  justify-content: flex-start;\n  flex-direction: column;\n  overflow-y: scroll;\n  gap: 4px;\n  width: 100%;\n  height: 100%;\n\n  /* width */\n  &::-webkit-scrollbar {\n    width: 10px;\n  }\n\n  /* Track */\n  &::-webkit-scrollbar-track {\n    background: unset;\n  }\n\n  /* Handle */\n  &::-webkit-scrollbar-thumb {\n    border-radius: 4px;\n    background: #777;\n  }\n\n  /* Handle on hover */\n  &::-webkit-scrollbar-thumb:hover {\n    background: #888;\n  }\n"]))),Jn=V.a.div(E||(E=Object(U.a)(["\n  display: flex;\n  flex-direction: row;\n  justify-content: flex-start;\n  align-items: center;\n  gap: 16px;\n  cursor: pointer;\n  padding: 4px 16px;\n  margin-left: 16px;\n  border-radius: 5px;\n  width: calc(100% - 32px);\n\n  &:hover {\n    color: #eeeeee;\n    background-color: #7676767e;\n  }\n\n  .skin-img {\n  }\n  .skin-text {\n    color: #e1e1e1;\n  }\n  &.current-skin {\n    box-shadow: 0px 0px 5px 1px #eeeeee9a;\n    background-color: #eeeeee9a;\n    .skin-text {\n      color: #181818;\n    }\n  }\n  .current-skin-text {\n    color: #91ff31;\n    font-weight: bold;\n  }\n"]))),Wn=V.a.span(I||(I=Object(U.a)(["\n  background-color: #ffc60a;\n  color: #3e3003;\n  font-weight: bold;\n"]))),$n=(V.a.div(z||(z=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  border-radius: 5px;\n  background-color: #eeeeeee7;\n"]))),V.a.div(L||(L=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  align-items: center;\n  justify-content: center;\n"]))),Object(V.a)(sn.Button)(R||(R=Object(U.a)(["\n  display: flex;\n  position: absolute;\n  top: 12px;\n  right: 15px;\n  width: 22px;\n  height: 22px;\n  font-weight: bold;\n  justify-content: center;\n  align-items: center;\n  border-radius: 5px !important;\n  background-color: #e6ae35;\n  color: #eeeeee;\n  font-weight: bolder;\n  border: unset;\n\n  &:hover {\n    color: #eeeeee;\n    background-color: #f4c04f;\n  }\n\n  &:active {\n    color: #eeeeee;\n    background-color: #e6ae35;\n  }\n  &:focus {\n    background-color: #c9982d;\n    color: #eeeeee;\n  }\n\n  .ex {\n    display: flex;\n    position: absolute;\n    left: 4;\n    width: 14px;\n    border-radius: 2px;\n    background-color: #eeeeee;\n    border: 2px solid #eeeeee;\n  }\n  .left {\n    transform: rotate(45deg);\n  }\n  .right {\n    transform: rotate(135deg);\n  }\n"])))),Gn=Object(V.a)(sn.Input)(M||(M=Object(U.a)(["\n  width: calc(100% - 30px);\n  background-color: #2b2b2bc7;\n  color: #eeeeee;\n  border: 1px solid #4f3b11c6;\n  &:hover {\n    border: 1px solid #9a7320;\n  }\n  &:focus {\n    border: 1px solid #d5a130;\n  }\n  &:disabled {\n    background-color: #c8c8c8;\n  }\n"]))),Un=V.a.span(T||(T=Object(U.a)(["\n  display: flex;\n  width: 100%;\n  justify-content: center;\n  color: #eeeeee;\n"]))),Vn=function(n){var e,t=n.isOpen,i=n.currentSkin,a=n.onCancel,c=n.hideCloseButton,r=void 0!==c&&c,o=n.setCurrentSkin,s=n.onConfirm,l=Object(A.useState)([]),d=Object(W.a)(l,2),u=d[0],b=d[1],m=Object(A.useState)(""),p=Object(W.a)(m,2),g=p[0],x=p[1],f=(e={searchFor:"\ub370\ubbf8\uc9c0 \uc2a4\ud0a8"},Object(Q.useQuery)(["getItemList",e],Object(Tn.a)(Mn.a.mark((function n(){return Mn.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.abrupt("return",An(e));case 1:case"end":return n.stop()}}),n)}))),{retry:!1,refetchOnWindowFocus:!1,keepPreviousData:!0}));Object(A.useEffect)((function(){var n,e=[];null===(n=f.data)||void 0===n||n.forEach((function(n){e.find((function(e){return"\ud30c\ud2f0 \ud018\uc2a4\ud2b8 \ub370\ubbf8\uc9c0 \uc2a4\ud0a8"!==e.name&&e.name===n.name}))||!n.name.includes("\ub370\ubbf8\uc9c0 \uc2a4\ud0a8")||n.name.includes("\uc0c1\uc790")||n.name.includes("\uc800\uc7a5 \uc2a4\ud06c\ub864")||n.name.includes("1\uce78 \ud655\uc7a5\uad8c")||n.name.includes("\uc120\ud0dd\uad8c")||n.name.includes("\ucd94\ucd9c\uad8c")||n.name.includes("\ubcf4\ub984\ub2ec \ud2f0\ucf13")||n.name.includes("VIP \ud2f0\ucf13")||n.name.includes("RISE \ud2f0\ucf13")||n.name.includes("\uac01\uc131\uc758 \ud2f0\ucf13")||n.name.includes("\uad50\ud658\uad8c")||(e.push(n),"\ud750\ubb3c\ub0e5 \ub370\ubbf8\uc9c0 \uc2a4\ud0a8"===n.name&&o(n))}));var t=0;e=e.filter((function(n){return"\ud30c\ud2f0 \ud018\uc2a4\ud2b8 \ub370\ubbf8\uc9c0 \uc2a4\ud0a8"!==n.name||("\ud30c\ud2f0 \ud018\uc2a4\ud2b8 \ub370\ubbf8\uc9c0 \uc2a4\ud0a8"===n.name?t<2&&(t+=1,!0):void 0)})),b(e.sort((function(n,e){return n.id-e.id})))}),[f.data]);var j=function(){a()},h=function(){return void 0===g||""===g?u:u.filter((function(n){return n.name.toLocaleLowerCase().indexOf(g.toLocaleLowerCase())>-1}))},O=function(n){var e=g.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&"),t=n.split(new RegExp("(".concat(e,")"),"gi"));return Object(an.jsx)(an.Fragment,{children:t.map((function(n,e){return n.toLowerCase()===g.toLowerCase()?Object(an.jsx)(Wn,{children:n},e):Object(an.jsx)(H.a.Fragment,{children:n},e)}))})};return Object(an.jsxs)(an.Fragment,{children:[Object(an.jsx)(Kn,{isOpen:t,onClick:j}),Object(an.jsxs)(Pn,{isOpen:t,children:[Object(an.jsx)(Qn,{children:"\ub370\ubbf8\uc9c0 \uc2a4\ud0a8 \uc120\ud0dd"}),Object(an.jsx)(Gn,{maxLength:20,value:g,placeholder:"\uac80\uc0c9",onChange:function(n){return x(n.target.value)}}),!r&&Object(an.jsxs)($n,{size:"small",onClick:j,children:[Object(an.jsx)("div",{className:"ex left"}),Object(an.jsx)("div",{className:"ex right"})]}),Object(an.jsx)(Yn,{children:h().length>0?h().map((function(n){return Object(an.jsxs)(Jn,{className:i&&i.id===n.id?"current-skin":"",onClick:function(){return function(n){o(n),s(Hn[n.id]),j()}(n)},children:[Object(an.jsx)("img",{className:"skin-img",src:"https://maplestory.io/api/KMS/352/item/".concat(n.id,"/icon")}),Object(an.jsx)("span",{className:"skin-text",children:n.name?O(n.name):void 0}),i&&i.id===n.id&&Object(an.jsx)("span",{className:"current-skin-text",children:"\ucc29\uc6a9\uc911"})]},n.id)})):Object(an.jsxs)(Un,{children:["[",g,"] \uc2a4\ud0a8\uc774 \uc5c6\uc2b5\ub2c8\ub2e4."]})})]})]})},_n=V.a.div(B||(B=Object(U.a)(["\n  display: flex;\n  height: 100%;\n  width: 100%;\n  padding: 20px;\n  padding-left: 4px;\n  justify-content: space-between;\n  align-items: center;\n  flex-direction: row;\n"]))),qn=V.a.div(F||(F=Object(U.a)(["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: fit-content;\n  border-radius: 5px;\n  padding: 8px 16px;\n  gap: 10px;\n  transition: all 0.2s ease;\n  cursor: pointer;\n  &:hover {\n    background-color: #434956;\n  }\n\n  .skin-img {\n  }\n  .skin-text {\n    font-weight: bold;\n    color: #e1e1e1;\n  }\n"]))),Xn=function(n){var e=n.skinNumber,t=n.onSetSkinNumber,i=n.currentSkin,a=n.setCurrentSkin,c=n.setting,r=n.setSetting,o=Object(A.useState)(!1),s=Object(W.a)(o,2),l=s[0],d=s[1],u=Object(A.useState)(!1),b=Object(W.a)(u,2),m=b[0],p=b[1];return Object(A.useEffect)((function(){!function(){for(var n=0;n<=9;n++)(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoCri1-").concat(n,".png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoCri0-").concat(n,".png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoRed1-").concat(n,".png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoRed0-").concat(n,".png");(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoCri1-effect3.png"),(null===i||void 0===i?void 0:i.name.includes("\uc720\ub2db"))&&((new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoCri0-3.png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoCri0-4.png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoRed0-3.png"),(new Image).src="".concat("/maple-demage-skin-simulator","/images/export/Effect-DamageSkin.img-").concat(e,"-NoRed0-4.png"))}()}),[e]),Object(an.jsxs)(an.Fragment,{children:[i&&Object(an.jsxs)(_n,{children:[Object(an.jsxs)(qn,{onClick:function(){return d(!0)},children:[Object(an.jsx)("img",{className:"skin-img",src:"https://maplestory.io/api/KMS/352/item/".concat(i.id,"/icon")}),Object(an.jsx)("span",{className:"skin-text",children:i.name})]}),Object(an.jsx)(xn,{onClick:function(){return p(!0)},children:"\uc138\ud305"})]}),Object(an.jsx)(Ln,{isOpen:m,setting:c,setSetting:r,onCancel:function(){return p(!1)}}),Object(an.jsx)(Vn,{isOpen:l,currentSkin:i,setCurrentSkin:a,onCancel:function(){return d(!1)},onConfirm:function(n){t(n)}})]})},Zn="".concat("/maple-demage-skin-simulator","/images/hit1_0.png"),ne="".concat("/maple-demage-skin-simulator","/images/stand.gif"),ee=function(){var n=Object(A.useState)(287),e=Object(W.a)(n,2),t=e[0],i=e[1],a=Object(A.useState)([]),c=Object(W.a)(a,2),r=c[0],o=c[1],s=Object(A.useState)(!1),l=Object(W.a)(s,2),d=l[0],u=l[1],b=Object(A.useState)(),m=Object(W.a)(b,2),p=m[0],g=m[1],x=Object(A.useState)({numberAttack:1,maxDamage:1e6,minDamage:1e5,criticalRate:60}),f=Object(W.a)(x,2),j=f[0],h=f[1];function O(n){var e=n.min,t=n.max;return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e))+e}return Object(A.useEffect)((function(){$.a.initialize("UA-178457189-3")}),[]),Object(an.jsxs)(_,{children:[Object(an.jsx)(q,{children:Object(an.jsx)(Xn,{onSetSkinNumber:function(n){i(n),o([])},skinNumber:t,currentSkin:p,setCurrentSkin:g,setting:j,setSetting:h})}),Object(an.jsxs)(X,{className:"no-drag",children:[Object(an.jsx)(jn,{style:{justifyContent:"center"},children:r.map((function(n){return Object(an.jsx)(cn,{damageItem:n,setDamageList:o,currentSkin:p},n.id)}))}),Object(an.jsx)(Z,{draggable:"false",src:d?Zn:ne,alt:"orange-mushroom",onClick:function(){return function(){u(!0);for(var n=[],e=0;e<(j.numberAttack||0);e++){var i={id:Object(G.a)(),skinNumber:t,damage:O({min:j.minDamage||0,max:j.maxDamage||0}),isCritical:100*Math.random()<(j.criticalRate||0)};n.push(i)}setTimeout((function(){u(!1)}),1e3),o([].concat(Object(J.a)(r),n))}()}})]})]})},te=(t(815),new Q.QueryClient);P.a.render(Object(an.jsx)(H.a.StrictMode,{children:Object(an.jsx)(Q.QueryClientProvider,{client:te,children:Object(an.jsx)(Y.a,{children:Object(an.jsx)(ee,{})})})}),document.getElementById("root"))}},[[817,1,2]]]);