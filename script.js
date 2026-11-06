var CATS={
 kedaluwarsa:{n:"Makanan kedaluwarsa",c:"#d64545",s:"Catat lokasi dan jenis produk, lalu laporkan. Jangan mengonsumsi makanan tersebut."},
 tercemar:{n:"Makanan tercemar",c:"#2e9d5b",s:"Laporkan kondisi dan foto jika aman. Hindari mengonsumsi makanan yang dicurigai."},
 higienis:{n:"Tempat makan tidak higienis",c:"#2f7fd1",s:"Laporkan lokasi dan kondisi yang terlihat tanpa mengganggu aktivitas di tempat tersebut."},
 simpan:{n:"Penyimpanan tidak sesuai",c:"#e0a800",s:"Sampaikan jenis masalah dan lokasi. Ikuti panduan penyimpanan yang aman."},
 lain:{n:"Lainnya",c:"#8a54c7",s:"Tuliskan keterangan yang jelas dan sertakan foto jika tersedia."}
};
var STAT=["Terkirim","Ditinjau","Ditindaklanjuti"];
var STC=["#2f7fd1","#e0a800","#2e9d5b"];
var TABS=[["home","🏠","Beranda"],["edu","📖","Edukasi"],["rem","⏰","Pengingat"],["rep","📝","Lapor"],["list","🗺️","Laporan"]];
var TIPS=["Cuci tangan dengan sabun selama 20 detik sebelum makan dan memasak.","Pisahkan talenan untuk daging mentah dan sayuran.","Simpan sisa makanan di kulkas maksimal 2 jam setelah dimasak.","Cuci buah dan sayur di bawah air mengalir sebelum dikonsumsi.","Masak daging, ayam, dan telur hingga benar-benar matang."];
var EDU=[
 ["Memilih makanan yang aman",["Periksa tanggal kedaluwarsa dan kondisi kemasan: tidak penyok, bocor, atau menggembung.","Pilih bahan segar: warna normal, tidak berlendir, tidak berbau menyengat.","Beli produk beku atau dingin paling akhir saat berbelanja."]],
 ["Membaca label kemasan",["Cek tanggal kedaluwarsa, komposisi, dan izin edar.","Perhatikan keterangan alergen dan cara penyimpanan.","Bedakan “baik digunakan sebelum” dan “kedaluwarsa”."]],
 ["Menyimpan makanan",["Kulkas sebaiknya di bawah 5 °C, freezer di bawah −18 °C.","Gunakan wadah tertutup dan beri label tanggal.","Jangan biarkan makanan matang terlalu lama di suhu ruang."]],
 ["Mengolah dan menjaga kebersihan",["Cuci tangan, alat masak, dan permukaan dapur secara rutin.","Panaskan ulang makanan hingga benar-benar panas.","Gunakan air bersih dan matang untuk minum maupun memasak."]],
 ["Tips hidup sehat",["Perbanyak sayur dan buah, batasi gula, garam, dan gorengan.","Minum air putih yang cukup setiap hari.","Biasakan makan teratur dan istirahat cukup."]]
];
var SK=["terkirim","ditinjau","ditindaklanjuti"],SF="",AQ="";
var S={user:null,rem:[],rep:[],all:[],ready:false},view="home",cat="kedaluwarsa",pFile=null,pUrl="",geo=null,mode="login",D={lc:"",kt:""};
var CSRF="",ANIM=true;
var MAP=null,PICK=null,PM=null;
function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function $(i){return document.getElementById(i)}
function days(d){var t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(d+"T00:00:00")-t)/864e5)}
function remInfo(d){var n=days(d);if(n<0)return["Kedaluwarsa "+(-n)+" hari lalu","#d64545"];if(n===0)return["Kedaluwarsa hari ini","#d64545"];if(n<=3)return["Segera: "+n+" hari lagi","#d9a000"];return["Aman: "+n+" hari lagi","#2e9d5b"]}
function fmt(t){return new Date(t).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
function go(v){ANIM=true;view=v;if(v==="admin")S.users=null;render();window.scrollTo(0,0);if(v==="staff")loadStaff();if(v==="admin")loadAdmin()}
function tabsFor(){var t=TABS.slice();if(S.user&&S.user.role!=="warga")t.push(["staff","🛡️","Petugas"]);if(S.user&&S.user.role==="admin")t.push(["admin","👑","Admin"]);return t}
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
function pos(r){var h=hash(r.geo?r.geo.join(","):r.loc+r.id);return[20+h%260,20+((h>>8)%160)]}

/* ---------- Komunikasi dengan server (folder api/) ---------- */
function api(path,opt){opt=opt||{};if(opt.method&&opt.method!=="GET")opt.headers=Object.assign({},opt.headers,{"X-CSRF-Token":CSRF});return fetch("api/"+path,opt).then(function(r){return r.json().catch(function(){return{ok:false,pesan:"Respons server tidak valid"}})}).catch(function(){return{ok:false,pesan:"Tidak bisa terhubung ke server"}})}
function post(path,obj){return api(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj||{})})}
function normRep(r){var ok=r.latitude!=null&&r.longitude!=null;return{id:+r.id,cat:r.category,loc:r.location,note:r.note||"",photo:r.photo_url||"",geo:ok?[+r.latitude,+r.longitude]:null,hid:+r.is_hidden===1,st:Math.max(0,SK.indexOf(r.status)),ts:new Date(String(r.created_at).replace(" ","T")).getTime()}}
function loadData(){return Promise.all([api("reminder_list.php"),api("report_list.php?scope=mine"),api("report_list.php?scope=all")]).then(function(a){
 if(!a[1].ok){S.user=null;S.ready=true;render();return}
 S.rem=(a[0].pengingat||[]).map(function(r){return{id:+r.id,name:r.food_name,date:r.expiry_date}});
 S.rep=(a[1].laporan||[]).map(normRep);
 S.all=(a[2].laporan||[]).map(normRep);
 S.ready=true;render()})}

function authView(){var d=mode==="register";
 return'<div class="login"><div class="logo">🥗</div><h2>Aman Makan</h2><p class="mu">Aplikasi kesehatan untuk melaporkan masalah keamanan pangan dan belajar memilih, menyimpan, serta mengonsumsi makanan dengan aman.</p><div class="card">'+
 (d?'<label for="nm">Nama</label><input id="nm" autocomplete="name">':'')+
 '<label for="em">Email</label><input id="em" type="email" autocomplete="email"><label for="pw">Password</label><input id="pw" type="password" placeholder="Minimal 6 karakter" autocomplete="'+(d?"new-password":"current-password")+'">'+
 (d?'<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input id="ok" type="checkbox" style="width:auto;margin-top:3px"><span>Saya menyetujui <a href="privasi.html" target="_blank" rel="noopener" style="color:var(--pr)">Kebijakan Privasi</a>.</span></label>':'')+'<button class="btn" onclick="auth()">'+(d?"Daftar":"Masuk")+'</button>'+
 '<button class="btn s" style="margin-top:10px" onclick="mode=\''+(d?"login":"register")+'\';render()">'+(d?"Sudah punya akun? Masuk":"Belum punya akun? Daftar")+'</button></div></div>'}
function auth(){var d=mode==="register";if(d&&!$("ok").checked){alert("Centang persetujuan Kebijakan Privasi terlebih dahulu.");return}var b={email:$("em").value,password:$("pw").value};if(d)b.name=$("nm").value;
 post(d?"register.php":"login.php",b).then(function(r){if(!r.ok){alert(r.pesan);return}S.user=r.user;S.ready=false;view="home";render();loadData()})}
$("out").onclick=function(){post("logout.php").then(function(){return api("me.php")}).then(function(r){CSRF=r.csrf||"";S={user:null,rem:[],rep:[],all:[],ready:true};view="home";mode="login";render()})};

function render(){
 killMaps();var app=$("app"),nav=$("nav");
 $("out").hidden=!S.user;
 if(!S.ready){nav.hidden=true;app.innerHTML='<p class="mu" style="text-align:center;margin-top:40vh">Memuat…</p>';return}
 if(!S.user){nav.hidden=true;app.innerHTML=authView();fx(app);return}
 nav.hidden=false;
 var tb=tabsFor(),sig=tb.map(function(t){return t[0]}).join();
 if(nav.dataset.sig!==sig){nav.dataset.sig=sig;nav.innerHTML=tb.map(function(t){return'<button data-v="'+t[0]+'" onclick="go(\''+t[0]+'\')"><span>'+t[1]+'</span>'+t[2]+'</button>'}).join("")}
 Array.prototype.forEach.call(nav.children,function(b){b.classList.toggle("on",b.dataset.v===view)});
 app.innerHTML=V[view]();
 fx(app);
 if(view==="list")initMap();if(view==="rep")initPicker();
}
var V={
 home:function(){
  var soon=S.rem.filter(function(r){return days(r.date)<=3});
  return'<div class="hero"><i class="fl f1">🥦</i><i class="fl f2">🍎</i><i class="fl f3">🍋</i><h2>Halo, '+esc(S.user.name)+'!</h2><p>Yuk jaga pangan, jaga kesehatanmu.</p></div>'+
  (soon.length?'<div class="warn">⚠️ <b>'+soon.length+' makanan</b> segera atau sudah kedaluwarsa: '+soon.map(function(r){return esc(r.name)}).join(", ")+'. <a href="#" onclick="go(\'rem\');return false" style="color:inherit">Lihat</a></div>':'')+
  '<div class="grid"><button class="menu" onclick="go(\'edu\')"><span>📖</span>Edukasi Pangan</button><button class="menu" onclick="go(\'rem\')"><span>⏰</span>Pengingat Kedaluwarsa</button><button class="menu" onclick="go(\'rep\')"><span>📝</span>Lapor Masalah</button><button class="menu" onclick="go(\'list\')"><span>🗺️</span>Peta &amp; Status</button></div>'+
  '<div class="card" style="margin-top:12px"><h3>💡 Tips hidup sehat hari ini</h3>'+TIPS[new Date().getDate()%TIPS.length]+'</div>'+
  '<div class="card"><h3>Jenis masalah yang bisa dilaporkan</h3>'+Object.keys(CATS).map(function(k){return'<div style="margin:6px 0"><span class="chip" style="background:'+CATS[k].c+'">'+CATS[k].n+'</span></div>'}).join("")+'</div>'+
  '<button class="btn s" style="margin-bottom:12px" onclick="go(\'acc\')">⚙️ Akun saya</button> <a href="privasi.html" target="_blank" rel="noopener" style="color:var(--pr);font-size:13px;margin-left:8px">Kebijakan Privasi</a>'+
  '<p class="mu">Aplikasi ini membantu menyampaikan informasi awal. Penilaian dan penanganan resmi tetap dilakukan oleh pihak berwenang.</p>'},
 edu:function(){
  return'<h2>Edukasi Keamanan Pangan</h2>'+EDU.map(function(e){return'<details><summary>'+e[0]+'</summary><ul>'+e[1].map(function(x){return'<li>'+x+'</li>'}).join("")+'</ul></details>'}).join("")+
  '<div class="warn"><b>🚨 Informasi gejala</b><br>Gejala keracunan makanan: mual, muntah, diare, sakit perut, demam. Segera cari bantuan tenaga kesehatan jika gejala berat, berlangsung lama, atau dialami anak, lansia, dan ibu hamil.</div>'},
 rem:function(){
  var l=S.rem;
  return'<h2>Pengingat Kedaluwarsa</h2><div class="card"><label for="rn">Nama makanan</label><input id="rn" placeholder="Contoh: Susu UHT"><label for="rd">Tanggal kedaluwarsa</label><input id="rd" type="date"><button class="btn" onclick="addRem()">Simpan pengingat</button><button class="btn s" style="margin-top:10px" onclick="notif()">🔔 Aktifkan notifikasi</button></div>'+
  (l.length?l.map(function(r){var i=remInfo(r.date);return'<div class="card row"><div><b>'+esc(r.name)+'</b><div class="mu">'+esc(r.date)+'</div><span class="chip" style="background:'+i[1]+'">'+i[0]+'</span></div><button class="btn s" onclick="delRem('+r.id+')">Hapus</button></div>'}).join(""):'<p class="mu">Belum ada pengingat.</p>')},
 rep:function(){
  return'<h2>Lapor Masalah Pangan</h2><div class="card"><label>Kategori masalah</label><div class="cats">'+Object.keys(CATS).map(function(k){return'<button class="cat '+(cat===k?"on":"")+'" onclick="cat=\''+k+'\';render()"><i style="background:'+CATS[k].c+'"></i>'+CATS[k].n+'</button>'}).join("")+'</div><p class="mu">💡 '+CATS[cat].s+'</p>'+
  '<label for="lc">Lokasi</label><input id="lc" value="'+esc(D.lc)+'" oninput="D.lc=this.value" placeholder="Nama tempat / alamat"><button class="btn s" style="margin-top:6px" onclick="getGeo()">📍 Gunakan lokasi saya</button><div class="mu" id="gs">'+(geo?"Koordinat: "+geo.join(", "):"Atau ketuk peta untuk menandai lokasi kejadian.")+'</div><div id="pick" class="map-box" style="height:220px;margin-top:6px"></div>'+
  '<label for="kt">Keterangan</label><textarea id="kt" rows="3" oninput="D.kt=this.value" placeholder="Ceritakan kondisi yang ditemukan">'+esc(D.kt)+'</textarea>'+
  '<label for="ph">Foto (opsional)</label><input id="ph" type="file" accept="image/*" onchange="pick(this)">'+(pUrl?'<img class="photo" src="'+pUrl+'" alt="Pratinjau foto">':'')+
  '<button class="btn" onclick="submitRep()">Kirim laporan</button><p class="mu">Izin foto dan lokasi hanya diminta saat Anda memilihnya. Jangan sertakan data pribadi orang lain.</p></div>'},
 acc:function(){return'<h2>Akun saya</h2><div class="card"><b>'+esc(S.user.name)+'</b><div class="mu">'+esc(S.user.email)+' • '+esc(S.user.role)+'</div></div><div class="card"><h3>Ganti password</h3><label for="op">Password lama</label><input id="op" type="password" autocomplete="current-password"><label for="np">Password baru</label><input id="np" type="password" placeholder="Minimal 6 karakter" autocomplete="new-password"><button class="btn" onclick="chPw()">Simpan password baru</button></div>'},
 admin:function(){
  return'<h2>Kelola Pengguna</h2><p class="mu" style="margin-top:-6px">Tunjuk petugas atau admin. Warga biasa hanya bisa melapor.</p><input id="aq" placeholder="Cari nama atau email" value="'+esc(AQ)+'" oninput="setAQ(this.value)"><div id="ulist" style="margin-top:12px">'+usersHtml()+'</div>'},
 staff:function(){
  var L=S.staff||[];
  return'<h2>Panel Petugas</h2><p class="mu" style="margin-top:-6px">Tinjau laporan warga dan perbarui statusnya.</p>'+
  '<div class="cats" style="margin-bottom:12px">'+[["","Semua"]].concat(STAT.map(function(x,i){return[SK[i],x]})).map(function(f){return'<button class="cat '+(SF===f[0]?"on":"")+'" style="text-align:center" onclick="setSF(\''+f[0]+'\')">'+f[1]+'</button>'}).join("")+'</div>'+
  (L.length?L.map(function(r){return'<div class="card"><div class="row"><span class="chip" style="background:'+CATS[r.cat].c+'">'+CATS[r.cat].n+'</span><span class="chip" style="background:'+STC[r.st]+'">'+STAT[r.st]+'</span>'+(r.hid?'<span class="chip" style="background:#777">Disembunyikan</span>':'')+'</div><p style="margin:8px 0 2px"><b>'+esc(r.loc)+'</b></p><div class="mu">Oleh '+esc(r.by)+' • '+fmt(r.ts)+'</div><p>'+esc(r.note)+'</p>'+
   (r.geo?'<a href="https://www.google.com/maps?q='+r.geo[0]+','+r.geo[1]+'" target="_blank" rel="noopener" style="color:var(--pr)">📍 Buka lokasi di peta</a>':'')+
   (r.photo?'<img class="photo" src="'+esc(r.photo)+'" alt="Foto laporan">':'')+
   '<div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:10px">'+STAT.map(function(x,i){return'<button class="btn s" style="'+(r.st===i?"background:"+STC[i]+";color:#fff;border-color:"+STC[i]:"")+'" onclick="setSt('+r.id+','+i+')">'+x+'</button>'}).join("")+'<button class="btn s" onclick="setHide('+r.id+','+(r.hid?0:1)+')">'+(r.hid?'👁️ Tampilkan':'🚫 Sembunyikan')+'</button></div></div>'}).join(""):'<p class="mu">Tidak ada laporan.</p>')},
 list:function(){
  var nog=S.all.filter(function(r){return!r.geo}).length;
  return'<h2>Peta Laporan</h2><div id="map" class="map-box"></div><div class="leg">'+Object.keys(CATS).map(function(k){return'<span><i style="background:'+CATS[k].c+'"></i>'+CATS[k].n+'</span>'}).join("")+'</div><p class="mu">Menampilkan '+(S.all.length-nog)+' laporan di peta'+(nog?' ('+nog+' laporan tanpa koordinat tidak ditampilkan)':'')+'.</p>'+
  '<h2>Laporan Saya</h2>'+(S.rep.length?S.rep.map(function(r){return'<div class="card"><div class="row"><span class="chip" style="background:'+CATS[r.cat].c+'">'+CATS[r.cat].n+'</span><span class="chip" style="background:'+STC[r.st]+'">'+STAT[r.st]+'</span></div><p style="margin:8px 0 2px"><b>'+esc(r.loc)+'</b></p><div class="mu">'+fmt(r.ts)+'</div><p>'+esc(r.note)+'</p>'+(r.hid?'<p class="mu">🚫 Laporan ini disembunyikan dari peta oleh petugas.</p>':'')+(r.photo?'<img class="photo" src="'+esc(r.photo)+'" alt="Foto laporan">':'')+'</div>'}).join(""):'<p class="mu">Belum ada laporan.</p>')}
};
var REDUCE=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var RO=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add("in");RO.unobserve(t);setTimeout(function(){t.classList.remove("rv","in")},650)})},{threshold:.08}):null;
function fx(app){
 if(ANIM&&!REDUCE){app.classList.remove("enter");void app.offsetWidth;app.classList.add("enter")}
 ANIM=false;
 if(REDUCE||!RO)return;
 var h=window.innerHeight;
 Array.prototype.forEach.call(app.querySelectorAll(".card,.menu,details"),function(el){if(el.getBoundingClientRect().top>h){el.classList.add("rv");RO.observe(el)}})}
(function(){var t=0,hd=document.querySelector("header");function on(){t=0;var y=window.scrollY||0;hd.classList.toggle("sc",y>8);if(!REDUCE)document.documentElement.style.setProperty("--sy",y)}window.addEventListener("scroll",function(){if(!t)t=requestAnimationFrame(on)},{passive:true});on()})();
function killMaps(){if(MAP){MAP.remove();MAP=null}if(PICK){PICK.remove();PICK=null;PM=null}}
function tiles(m){L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(m)}
function noMap(id){var e=$(id);if(e)e.innerHTML='<p class="mu" style="padding:14px">Peta tidak bisa dimuat. Periksa folder lib/leaflet dan koneksi internet.</p>'}
function initMap(){
 if(typeof L==="undefined"){noMap("map");return}
 MAP=L.map("map").setView([-2.5,118],5);tiles(MAP);
 var pts=[];
 S.all.forEach(function(r){if(!r.geo)return;pts.push(r.geo);L.circleMarker(r.geo,{radius:9,color:"#fff",weight:2,fillColor:CATS[r.cat].c,fillOpacity:1}).addTo(MAP).bindPopup("<b>"+esc(CATS[r.cat].n)+"</b><br>"+esc(r.loc)+"<br>Status: "+STAT[r.st])});
 if(pts.length)MAP.fitBounds(L.latLngBounds(pts),{padding:[30,30],maxZoom:16});
 setTimeout(function(){if(MAP)MAP.invalidateSize()},0)}
function initPicker(){
 if(typeof L==="undefined"){noMap("pick");return}
 PICK=L.map("pick").setView(geo||[-2.5,118],geo?16:5);tiles(PICK);putPM();
 PICK.on("click",function(e){setGeo(e.latlng.lat,e.latlng.lng)});
 setTimeout(function(){if(PICK)PICK.invalidateSize()},0)}
function putPM(){if(!PICK||!geo)return;if(PM)PM.setLatLng(geo);else PM=L.marker(geo).addTo(PICK)}
function setGeo(la,ln,z){geo=[+la.toFixed(5),+ln.toFixed(5)];var g=$("gs");if(g)g.textContent="Koordinat: "+geo.join(", ");if(PICK){putPM();if(z)PICK.setView(geo,z)}}
function addRem(){var n=$("rn").value.trim(),d=$("rd").value;if(!n||!d){alert("Isi nama makanan dan tanggal kedaluwarsa.");return}post("reminder_add.php",{name:n,date:d}).then(function(r){if(!r.ok){alert(r.pesan);return}loadData()})}
function delRem(id){post("reminder_delete.php",{id:id}).then(loadData)}
function notif(){try{Notification.requestPermission().then(function(p){alert(p==="granted"?"Notifikasi aktif. Pengingat akan muncul saat aplikasi dibuka.":"Izin notifikasi tidak diberikan.")})}catch(e){alert("Notifikasi tidak didukung di perangkat ini.")}}
function getGeo(){var g=$("gs");if(!navigator.geolocation){g.textContent="Lokasi tidak didukung.";return}g.textContent="Mencari lokasi…";navigator.geolocation.getCurrentPosition(function(p){setGeo(p.coords.latitude,p.coords.longitude,16)},function(){g.textContent="Izin lokasi ditolak. Tandai lokasi di peta atau isi manual."})}
function pick(inp){var f=inp.files[0];if(!f)return;var im=new Image();im.onload=function(){var s=Math.min(1,1000/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){pFile=b;pUrl=URL.createObjectURL(b);render()},"image/jpeg",.75)};im.onerror=function(){alert("File bukan gambar yang valid.")};im.src=URL.createObjectURL(f)}
function submitRep(){
 if(!D.lc.trim()||!D.kt.trim()){alert("Lokasi dan keterangan wajib diisi.");return}
 var fd=new FormData();fd.append("category",cat);fd.append("location",D.lc.trim());fd.append("note",D.kt.trim());
 if(geo){fd.append("latitude",geo[0]);fd.append("longitude",geo[1])}
 if(pFile)fd.append("photo",pFile,"foto.jpg");
 api("report_add.php",{method:"POST",body:fd}).then(function(r){
  if(!r.ok){alert(r.pesan);return}
  D={lc:"",kt:""};pFile=null;pUrl="";geo=null;
  alert("Laporan terkirim. Terima kasih sudah peduli keamanan pangan!");
  loadData().then(function(){go("list")})})}

function loadStaff(){api("staff_reports.php"+(SF?"?status="+SF:"")).then(function(r){if(!r.ok){alert(r.pesan);go("home");return}S.staff=(r.laporan||[]).map(function(x){var n=normRep(x);n.by=x.user_name;return n});if(view==="staff")render()})}
function setSF(f){SF=f;loadStaff()}
function setSt(id,i){post("staff_status.php",{id:id,status:SK[i]}).then(function(r){if(!r.ok){alert(r.pesan);return}loadStaff();loadData()})}
function usersHtml(){var L=S.users;if(!L)return'<p class="mu">Memuat…</p>';if(!L.length)return'<p class="mu">Tidak ada pengguna.</p>';var RN={warga:"Warga",petugas:"Petugas",admin:"Admin"};
 return L.map(function(u){var me=u.id===S.user.id;return'<div class="card"><b>'+esc(u.name)+'</b>'+(me?' <span class="mu">(Anda)</span>':'')+'<div class="mu">'+esc(u.email)+'</div><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:8px">'+
 ["warga","petugas","admin"].map(function(r){var on=u.role===r;return'<button class="btn s" '+(me?"disabled ":"")+'style="'+(on?"background:var(--pr);color:var(--bg);border-color:var(--pr)":"")+(me&&!on?";opacity:.5":"")+'" onclick="setRole('+u.id+',\''+r+'\')">'+RN[r]+'</button>'}).join("")+(me?'':'<button class="btn s" onclick="resetPw('+u.id+')">🔑 Atur ulang password</button>')+'</div></div>'}).join("")}
function loadAdmin(){api("admin_users.php"+(AQ?"?q="+encodeURIComponent(AQ):"")).then(function(r){if(!r.ok){alert(r.pesan);go("home");return}S.users=(r.pengguna||[]).map(function(u){u.id=+u.id;return u});var e=$("ulist");if(e)e.innerHTML=usersHtml()})}
var aqT;function setAQ(v){AQ=v.trim();clearTimeout(aqT);aqT=setTimeout(loadAdmin,300)}
function setRole(id,role){if(!confirm("Ubah peran pengguna ini menjadi "+role+"?"))return;post("admin_role.php",{id:id,role:role}).then(function(r){if(!r.ok){alert(r.pesan);return}loadAdmin()})}
function chPw(){post("change_password.php",{old:$("op").value,password:$("np").value}).then(function(r){alert(r.pesan);if(r.ok){$("op").value="";$("np").value=""}})}
function setHide(id,h){post("staff_hide.php",{id:id,hidden:h}).then(function(r){if(!r.ok){alert(r.pesan);return}loadStaff();loadData()})}
function resetPw(id){if(!confirm("Buat password sementara untuk pengguna ini? Password lamanya tidak berlaku lagi."))return;post("admin_reset.php",{id:id}).then(function(r){if(!r.ok){alert(r.pesan);return}prompt("Password sementara. Salin dan berikan ke pengguna, minta ia menggantinya di menu Akun saya:",r.temp)})}
api("me.php").then(function(r){CSRF=r.csrf||"";S.user=r.user||null;if(S.user){loadData()}else{S.ready=true;render()}});
render();