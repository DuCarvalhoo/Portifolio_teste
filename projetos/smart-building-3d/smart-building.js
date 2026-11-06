const $ = (selector) => document.querySelector(selector);
const viewport = $('#building-viewport');
const loading = $('#scene-loading');
const rooms = [
  { id:'sala', name:'Sala de estar', area:'≈10 m²', x:-1.9, z:1.55, w:3.7, d:2.75, color:0x8ab4c7, description:'Sala integrada com sofá em L, poltronas, mesa de centro, tapete e acesso direto à varanda.' },
  { id:'jantar', name:'Sala de jantar', area:'≈8 m²', x:1.65, z:1.55, w:2.8, d:2.75, color:0xc7a37c, description:'Área de refeições integrada à sala e próxima à cozinha, com mesa, cadeiras e circulação livre.' },
  { id:'cozinha', name:'Cozinha', area:'≈7 m²', x:2.15, z:-0.85, w:3.25, d:2.15, color:0xa9c6ac, description:'Cozinha com bancada, armários inferiores e superiores, cuba, cooktop, coifa e geladeira.' },
  { id:'suite', name:'Suíte', area:'≈7 m²', x:-2.15, z:-1.15, w:3.0, d:2.3, color:0xb5a0ca, description:'Quarto principal com cama de casal, cabeceira, mesas laterais, roupeiro e acesso ao banheiro privativo.' },
  { id:'quarto', name:'Quarto 02', area:'≈6 m²', x:0, z:-3.0, w:2.4, d:2.4, color:0xc1b18e, description:'Quarto secundário compacto, com cama, armário e espaço de apoio.' },
  { id:'banho-suite', name:'Banheiro da suíte', area:'≈2,3 m²', x:-2.55, z:-3.15, w:1.65, d:1.4, color:0x9bb9c5, description:'Banheiro privativo da suíte, com box, chuveiro, bancada e louças.' },
  { id:'banho', name:'Banheiro social', area:'≈2 m²', x:1.55, z:-3.15, w:1.45, d:1.4, color:0x91b9c7, description:'Banheiro social com box, lavatório e vaso sanitário.' },
  { id:'servico', name:'Área de serviço', area:'≈1,8 m²', x:3.15, z:-3.15, w:1.25, d:1.4, color:0x9caa9f, description:'Área de serviço ventilada com tanque, máquina de lavar e armário de apoio.' },
  { id:'varanda', name:'Varanda', area:'≈4 m²', x:-1.65, z:3.45, w:3.8, d:1.1, color:0x85b8bc, description:'Varanda frontal com guarda-corpo, duas poltronas e vegetação ornamental.' }
];
let THREE, OrbitControls, renderer, scene, camera, controls, raycaster, pointer;
let buildingGroup, apartmentGroup, floorGroups = [], roomMeshes = [], selectedFloor = -1, floorCount = 8;
let mode = 'building', cameraMode = 'orbit', selectedRoom = null, transparentWalls = false, hoveredFloor = -1, environmentGroup;
const mats = {};
function material(name,color,roughness=.7,metalness=.05){
 if(mats[name])return mats[name];
 const m=new THREE.MeshStandardMaterial({color,roughness,metalness});
 if(['wood','aptfloor','slab','wall','counter'].includes(name))m.map=surfaceTexture(name==='wood'||name==='aptfloor');
 return mats[name]=m;
}
function surfaceTexture(wood=false){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle='#e6dfd3';x.fillRect(0,0,256,256);let seed=41;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<5000;i++){x.fillStyle='rgba(45,35,25,'+(random()*.17)+')';x.fillRect(random()*256,random()*256,wood?random()*70:2,1);}
 if(wood){x.strokeStyle='#44301f40';for(let y=0;y<256;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke();x.strokeRect(y%64?55:0,y,128,32);}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;
}
function box(parent,w,h,d,x,y,z,mat,opts={}){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat.clone());
  mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true;
  if(opts.name) mesh.name=opts.name;
  if(opts.room){mesh.userData.room=opts.room;roomMeshes.push(mesh);}
  mesh.userData.structural=Boolean(opts.structural);parent.add(mesh); return mesh;
}
function cylinder(parent, radiusTop, radiusBottom, height, x, y, z, mat, segments=18){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments),mat.clone());
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function sphere(parent, radius, x, y, z, mat, sx=1, sy=1, sz=1){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),mat.clone());
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function addDoorFrame(parent,x,z,rotation=0){
  const frame=material('door-frame',0x76563d,.65);
  const g=new THREE.Group();g.position.set(x,.1,z);g.rotation.y=rotation;parent.add(g);
  box(g,.09,2.05,.12,-.48,1.02,0,frame);box(g,.09,2.05,.12,.48,1.02,0,frame);box(g,1.05,.1,.12,0,2.02,0,frame);
  box(g,.82,1.9,.045,0,1,0,material('door-leaf',0xb78d68,.68));
  box(g,.035,.035,.035,.32,1,0,material('door-handle',0xc2a36b,.3,.7));
  return g;
}
function addTree(parent,x,z,scale=1){
  const trunk=material('tree-trunk',0x66503c,.95),leaf=material('tree-leaf',0x667d69,.95);
  cylinder(parent,.13*scale,.19*scale,1.55*scale,x,.48*scale,z,trunk,9);
  sphere(parent,.72*scale,x,.48*scale+1.15*scale,z,leaf,1,1.1,1);
  sphere(parent,.48*scale,x-.38*scale,.48*scale+1.42*scale,z+.08*scale,leaf,1,1,1);
  sphere(parent,.48*scale,x+.36*scale,.48*scale+1.35*scale,z-.12*scale,leaf,1,1,1);
}
function addNeighborhood(){
  if(environmentGroup)return;environmentGroup=new THREE.Group();scene.add(environmentGroup);
  const curb=material('curb',0x858b8d,.9),road=material('road',0x30383f,.98),walk=material('walk',0x9a9a92,.94),lawn=material('lawn',0x596b59,.96),neighbor=material('neighbor',0x686f75,.9),neighbor2=material('neighbor2',0x7b817e,.9),windowMat=new THREE.MeshPhysicalMaterial({color:0x9db9c0,roughness:.42,metalness:.08,transparent:true,opacity:.38});
  box(environmentGroup,42,.12,9,0,-.29,13,road);
  box(environmentGroup,42,.16,2.2,0,-.2,7.25,walk);
  box(environmentGroup,42,.14,1.5,0,-.23,5.4,lawn);
  box(environmentGroup,42,.16,2.0,0,-.2,-7.8,walk);
  // Small neighboring buildings stay low in contrast and below the main tower's visual weight.
  const homes=[[-12,2.5,-4.8,5.8,5,5.5],[-13,2.3,5.5,5.2,4.6,5], [12,2.8,-5.8,6.2,5.6,5.2],[13,2.2,5.3,5.4,4.4,4.8]];
  homes.forEach((h,i)=>{
    const [x,y,z,w,ht,d]=h;const m=i%2?neighbor2:neighbor;
    box(environmentGroup,w,ht,d,x,y,z,m);box(environmentGroup,w+.18,.25,d+.18,x,y+ht/2+.12,z,material('neighbor-roof',0x555d65,.9));
    for(let row=0;row<2;row++)for(let col=0;col<2;col++)box(environmentGroup,.72,.88,.05,x+(col?1.25:-1.25),y-ht*.18+row*1.45,z+d/2+.035,windowMat);
  });
  for(const [x,z,sc] of [[-8,4.8,1.05],[8,4.2,.95],[-9,-5.4,.85],[9,-5.5,.9]])addTree(environmentGroup,x,z,sc);
  const lamp=material('street-lamp',0x303b45,.55,.5),glow=new THREE.MeshStandardMaterial({color:0xffe7b4,emissive:0xffd58a,emissiveIntensity:.8});
  for(const x of [-6,6]){cylinder(environmentGroup,.055,.075,3.2,x,1.35,8.2,lamp,10);box(environmentGroup,.62,.07,.08,x+.24,2.92,8.2,lamp);sphere(environmentGroup,.13,x+.49,2.86,8.2,glow);}
}

function addBuildingFloor(index){
  const g=new THREE.Group(); g.position.y=index*2.72;
  const slab=material('slab',0x9aa8b7,.85).clone(); const wall=material('wall',0xe0e6e9,.75).clone(); const glass= new THREE.MeshPhysicalMaterial({color:0x5ec9dd,roughness:.14,metalness:.12,transparent:true,opacity:.56,transmission:.14});
  const dark=material('dark',0x24374e,.55).clone(); const balcony=material('balcony',0x74879a,.65).clone();
  box(g,8.3,.22,7.2,0,0,0,slab);
  // Exterior envelope: rear and side walls; front is glazed to reveal the floor.
  box(g,8.1,2.45,.18,0,1.25,-3.48,wall);
  box(g,.18,2.45,7, -4.02,1.25,0,wall);
  box(g,.18,2.45,7, 4.02,1.25,0,wall);
  box(g,8.1,.16,.18,0,2.46,3.48,dark);
  for(let i=0;i<4;i++) box(g,1.55,1.75,.09,-2.9+i*1.92,1.3,3.43,glass);
  // Single balcony for the entire apartment on this floor.
  box(g,5.9,.16,1.45,0,.16,4.22,balcony);
  box(g,5.9,.82,.08,0,.62,4.92,glass);
  for(let x=-2.8;x<=2.81;x+=.55) box(g,.035,.82,.07,x,.62,4.92,dark);
  // Vertical structure and subtle floor lines.
  for(const x of [-4.05,4.05]) for(const z of [-3.5,3.5]) box(g,.24,2.68,.24,x,1.32,z,dark);
  g.userData.floor=index+1; buildingGroup.add(g); floorGroups.push(g);
}
function makeApartment(){
  apartmentGroup=new THREE.Group();roomMeshes=[];
  const floorMat=material('aptfloor',0xb9a997,.9),wallMat=new THREE.MeshStandardMaterial({color:0xe8e4dc,roughness:.88});
  box(apartmentGroup,8,.16,8,0,0,0,floorMat,{structural:true});
  rooms.forEach(r=>{
    const m=new THREE.MeshStandardMaterial({color:r.color,roughness:.9,transparent:true,opacity:.45,side:THREE.DoubleSide});
    const floor=box(apartmentGroup,r.w,.035,r.d,r.x,.105,r.z,m,{name:r.name,room:r});floor.userData.room=r;
  });
  // Perimeter walls: the front remains open/glazed toward the balcony for a readable cutaway.
  const walls=[];const outer=wallMat.clone();
  walls.push(box(apartmentGroup,8,.95,.14,0,.58,-3.92,outer));
  walls.push(box(apartmentGroup,.14,2.35,7.6,-3.92,1.2,0,outer));
  walls.push(box(apartmentGroup,.14,2.35,7.6,3.92,1.2,0,outer));
  // Interior partitions use short wall segments to preserve door openings and visible circulation.
  const partition=new THREE.MeshStandardMaterial({color:0xe4ded4,roughness:.9});
  walls.push(box(apartmentGroup,1.05,1.45,.12,-3.3,.83,-.05,partition));
  walls.push(box(apartmentGroup,4.7,1.45,.12,1.35,.83,-.05,partition));
  walls.push(box(apartmentGroup,.12,1.45,1.15,-.1,.83,-2.1,partition));
  walls.push(box(apartmentGroup,.12,1.45,.75,-.1,.83,-3.5,partition));
  walls.push(box(apartmentGroup,1.0,1.25,.1,-2.55,.72,-2.48,partition));
  walls.push(box(apartmentGroup,.72,1.25,.1,-.55,.72,-2.48,partition));
  walls.push(box(apartmentGroup,.1,1.25,.82,.75,.72,-3.5,partition));
  walls.push(box(apartmentGroup,.1,1.25,.82,2.35,.72,-3.5,partition));
  walls.push(box(apartmentGroup,.95,1.25,.1,3.15,.72,-2.48,partition));
  walls.forEach(w=>{w.userData.structural=true;});
  apartmentGroup.userData.walls=walls;
  // Door leaves and frames give each private room a clear access point.
  addDoorFrame(apartmentGroup,-2.0,-2.4,0);addDoorFrame(apartmentGroup,.35,-2.72,0);addDoorFrame(apartmentGroup,2.9,-2.72,0);

  const wood=material('wood',0x805b42,.72),oak=material('oak',0xa67b55,.72),cream=material('cream',0xd8cdbd,.86),fabric=material('fabric',0x526b83,.95),fabricLight=material('fabric-light',0x9aa9b8,.95),metal=material('metal',0x9aa7b2,.35,.6),black=material('appliance-dark',0x303a42,.38,.4),porcelain=material('porcelain',0xf0f3f3,.2),green=material('plant',0x4b8a65,.9);
  // Living room: L-shaped sofa, loose cushions, rug, coffee table and media panel.
  box(apartmentGroup,2.15,.16,1.0,-2.3,.16,1.48,fabric);box(apartmentGroup,2.15,.55,.18,-2.3,.49,1.92,fabric);
  box(apartmentGroup,.2,.62,1.0,-3.28,.42,1.48,fabric);box(apartmentGroup,.2,.62,1.0,-1.32,.42,1.48,fabric);
  box(apartmentGroup,.95,.16,.72,-1.65,.16,.72,fabric);box(apartmentGroup,.18,.5,.72,-1.22,.4,.72,fabric);
  for(const [x,z] of [[-2.85,1.45],[-2.05,1.45],[-1.63,.72]])box(apartmentGroup,.48,.1,.42,x,.32,z,fabricLight);
  box(apartmentGroup,2.85,.035,2.05,-2.0,.13,1.55,material('rug',0xb6a58e,.98));
  box(apartmentGroup,1.05,.12,.58,-1.15,.48,1.52,oak);for(const x of [-1.58,-.72])for(const z of [1.3,1.74])cylinder(apartmentGroup,.035,.035,.38,x,.28,z,metal,10);
  box(apartmentGroup,.08,1.35,.15,-.05,.78,1.5,wood);box(apartmentGroup,.9,.54,.06,-.05,.92,1.43,black);
  // Dining set with four individual chairs and visible legs.
  box(apartmentGroup,1.5,.12,.92,1.65,.83,1.45,oak);
  for(const x of [1.05,2.25])for(const z of [1.13,1.77]){cylinder(apartmentGroup,.045,.055,.66,x,.44,z,wood,10);box(apartmentGroup,.42,.1,.42,x,.44,z,fabricLight);box(apartmentGroup,.42,.48,.07,x,.7,z-.18,fabric);}
  // Kitchen: cabinetry, worktop, sink, tap, four-burner cooktop, hood and fridge.
  box(apartmentGroup,2.75,.72,.58,2.35,.48,-1.25,cream);box(apartmentGroup,2.9,.09,.68,2.35,.89,-1.25,material('counter',0x65717b,.35));
  for(const x of [1.35,2.0,2.65,3.3]){box(apartmentGroup,.025,.58,.015,x,.47,-.95,wood);box(apartmentGroup,.08,.025,.025,x+.18,.48,-.95,metal);}
  box(apartmentGroup,2.55,.62,.36,2.35,1.48,-1.55,cream);box(apartmentGroup,2.72,.06,.4,2.35,1.81,-1.55,oak);
  box(apartmentGroup,.65,.025,.38,1.55,.96,-1.3,metal);box(apartmentGroup,.52,.018,.27,1.55,.98,-1.3,black);
  for(const x of [1.37,1.62])for(const z of [-1.39,-1.19])cylinder(apartmentGroup,.065,.065,.025,x,1.01,z,metal,16);
  box(apartmentGroup,.62,1.8,.72,3.35,.98,-1.65,material('fridge',0xdfe8ed,.25,.15));box(apartmentGroup,.64,.025,.74,3.35,1.55,-1.65,metal);box(apartmentGroup,.035,.58,.04,3.08,1.1,-1.65,metal);
  box(apartmentGroup,.22,.3,.22,2.85,1.98,-1.55,black);box(apartmentGroup,1.35,.08,.55,2.3,2.05,-1.55,metal);
  // Suite: double bed with headboard, layered bedding, pillows and bedside tables.
  box(apartmentGroup,2.0,.23,2.05,-2.05,.23,-.95,wood);box(apartmentGroup,1.92,.2,1.92,-2.05,.43,-.95,cream);
  box(apartmentGroup,1.92,.08,.72,-2.05,.56,-1.5,fabricLight);box(apartmentGroup,1.92,.06,.62,-2.05,.61,-.43,fabric);
  for(const x of [-2.65,-1.45]){box(apartmentGroup,.65,.16,.38,x,.64,-1.55,cream);box(apartmentGroup,.62,.14,.34,x,.79,-1.55,porcelain);box(apartmentGroup,.08,.04,.08,x+.22,.85,-1.55,metal);}
  box(apartmentGroup,2.2,1.05,.14,-2.05,.66,-2.02,wood);
  box(apartmentGroup,1.05,1.95,.58,-3.35,1.02,-.55,oak);for(const y of [.6,1.15])box(apartmentGroup,.035,.025,.02,-2.92,y,-.24,metal);
  // Secondary bedroom with a compact bed and wardrobe.
  box(apartmentGroup,1.25,.18,1.05,-.22,.2,-3.23,wood);box(apartmentGroup,1.2,.16,.98,-.22,.37,-3.23,cream);box(apartmentGroup,1.18,.06,.34,-.22,.49,-3.62,fabricLight);box(apartmentGroup,1.25,.95,.1,-.22,.72,-3.78,wood);
  box(apartmentGroup,.35,1.55,.45,.52,.82,-2.98,oak);box(apartmentGroup,.04,.04,.04,.34,.85,-2.72,metal);
  // Two bathrooms: clear shower glazing, shower head, vanity, sink and toilet.
  function bathroom(x,z,scale=1){
    const glass=new THREE.MeshPhysicalMaterial({color:0x9ed5df,roughness:.12,transparent:true,opacity:.28,transmission:.12});
    box(apartmentGroup,.92,.08,.92,x,.16,z,porcelain);box(apartmentGroup,.92,1.85,.045,x-.48,1.08,z,glass);box(apartmentGroup,.045,1.85,.92,x,1.08,z-.46,glass);
    cylinder(apartmentGroup,.12,.12,.08,x-.2,1.98,z-.22,metal,14);cylinder(apartmentGroup,.025,.025,.55,x-.2,1.7,z-.22,metal,10);
    box(apartmentGroup,.58,.48,.42,x+.42,.42,z+.35,oak);cylinder(apartmentGroup,.24,.28,.13,x+.42,.7,z+.35,porcelain,20);
    box(apartmentGroup,.06,.55,.06,x+.42,.94,z+.35,metal);sphere(apartmentGroup,.34,x-.28,.38,z+.43,porcelain,.82,.62,1);cylinder(apartmentGroup,.25,.2,.48,x-.28,.21,z+.43,porcelain,18);
  }
  bathroom(-2.55,-3.15);bathroom(1.55,-3.15);
  // Laundry nook: washer with circular door and a utility sink.
  box(apartmentGroup,.62,.95,.62,3.12,.58,-3.18,porcelain);cylinder(apartmentGroup,.22,.22,.035,3.12,.64,-2.86,metal,24);cylinder(apartmentGroup,.16,.16,.04,3.12,.64,-2.83,black,24);
  box(apartmentGroup,.62,.12,.48,3.12,1.12,-3.18,oak);box(apartmentGroup,.38,.38,.32,3.12,1.34,-3.2,cream);
  // Balcony furniture, planters and leafy plants.
  box(apartmentGroup,.58,.14,.58,-2.8,.18,3.42,oak);box(apartmentGroup,.58,.38,.08,-2.8,.42,3.68,oak);
  box(apartmentGroup,.58,.14,.58,-1.95,.18,3.42,oak);box(apartmentGroup,.58,.38,.08,-1.95,.42,3.68,oak);
  for(const x of [2.45,3.15]){cylinder(apartmentGroup,.18,.22,.42,x,.25,3.42,material('planter',0x98765a,.9),12);sphere(apartmentGroup,.35,x,.68,3.42,green,.85,1.25,.85);sphere(apartmentGroup,.22,x-.14,.82,3.4,green);}
  apartmentGroup.userData.roomFloors=true;scene.add(apartmentGroup);apartmentGroup.visible=false;
}

function updateFloorOpacity(){
  floorGroups.forEach((g,i)=>{
    g.position.y=i*2.72;
    const selected=selectedFloor<0||i===selectedFloor;
    g.traverse(o=>{if(o.isMesh&&o.material){
      if(o.userData.baseOpacity===undefined){o.userData.baseOpacity=o.material.opacity;o.userData.baseTransparent=o.material.transparent;}
      o.material.transparent=!selected||o.userData.baseTransparent;
      o.material.opacity=selected?o.userData.baseOpacity:Math.min(o.userData.baseOpacity,.24);
      o.material.depthWrite=selected;
    }});
  });
}
function highlightFloor(index){
  if(hoveredFloor===index)return;hoveredFloor=index;
  floorGroups.forEach((g,i)=>g.traverse(o=>{
    if(!o.isMesh||!o.material||!o.material.emissive)return;
    if(o.userData.baseEmissive===undefined)o.userData.baseEmissive=o.material.emissive.getHex();
    o.material.emissive.setHex(i===index?0x07515a:o.userData.baseEmissive);
    o.material.emissiveIntensity=i===index?.52:0;
  }));
  if(renderer)renderer.domElement.style.cursor=index>=0?'pointer':'grab';
}
function smoothCameraTo(position,target,duration=520){
  const startPos=camera.position.clone(),startTarget=controls.target.clone(),endPos=position.clone(),endTarget=target.clone(),start=performance.now();
  function frame(now){const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t);camera.position.lerpVectors(startPos,endPos,e);controls.target.lerpVectors(startTarget,endTarget,e);controls.update();if(t<1)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}

function setMode(next){
  if(next==='apartment'&&selectedFloor<0)selectedFloor=0;
  mode=next; buildingGroup.visible=next==='building'; apartmentGroup.visible=next==='apartment';
  $('#scene-title').textContent=next==='building'?'Edifício residencial · visão externa':'Apartamento '+String(selectedFloor+1).padStart(2,'0')+' · unidade única do pavimento';
  $('#scene-subtitle').textContent=next==='building'?'Passe o cursor ou toque em um pavimento para selecioná-lo · arraste para girar':'Selecione um cômodo para consultar suas características';
  $('#back-building').classList.toggle('hidden',next==='building');
  ['view-plan','view-perspective','view-interior','toggle-walls','view-structure'].forEach(id=>$('#'+id).disabled=next==='building');
  if(next==='apartment'){
    transparentWalls=false;apartmentGroup.userData.walls.forEach(w=>{w.material.transparent=false;w.material.opacity=1;});$('#toggle-walls').classList.remove('active');$('#view-structure').classList.remove('active');apartmentGroup.children.forEach(o=>o.visible=true);
    camera.position.set(0,16,.01); controls.target.set(0,0,0); controls.minDistance=.3; controls.maxDistance=32; controls.update();
    $('#room-title').textContent='Planta do apartamento';
    $('#room-description').textContent='Uma unidade residencial por pavimento, com ambientes e mobiliário demonstrativos. Selecione um cômodo na cena ou na lista.';
  } else {
    camera.position.set(13,10,16); controls.target.set(0,floorCount*1.25,0); controls.minDistance=7; controls.maxDistance=100; controls.update();
    $('#room-title').textContent='Conheça o apartamento';
    $('#room-description').textContent='O edifício possui exatamente um apartamento por andar. Selecione um pavimento e explore a unidade.';
  }
  updateFloorButtons();if(next==='building')fitScene();
}
function updateFloorButtons(){
  const boxEl=$('#floor-selector'); boxEl.replaceChildren();
  for(let i=floorCount;i>=1;i--){const b=document.createElement('button');b.className='floor-btn'+(i-1===selectedFloor?' active':'');b.textContent=`${i}º`;b.addEventListener('click',()=>selectFloor(i-1));boxEl.append(b);}
  $('#unit-total').textContent=String(floorCount).padStart(2,'0');
}
function selectFloor(index,focus=true){
  selectedFloor=Math.max(0,Math.min(floorCount-1,index));updateFloorOpacity();updateFloorButtons();
  $('#scene-title').textContent=mode==='building'?`Pavimento ${selectedFloor+1} selecionado · 01 apartamento`:`Apartamento ${String(selectedFloor+1).padStart(2,'0')} · unidade única do pavimento`;
  $('#scene-subtitle').textContent=mode==='building'?'Pavimento destacado · clique em “Explorar apartamento” para entrar':'Um único apartamento neste pavimento · selecione um cômodo abaixo';
  $('#room-title').textContent=`${selectedFloor+1}º pavimento`;
  $('#room-description').textContent=`Unidade residencial ${String(selectedFloor+1).padStart(2,'0')}: existe exatamente um apartamento neste andar. Abra a unidade para explorar os ambientes.`;
  if(focus&&mode==='building'){
    const target=new THREE.Vector3(0,selectedFloor*2.72+1.2,0);
    const direction=camera.position.clone().sub(controls.target).normalize();
    const distance=Math.max(13,Math.min(19,camera.position.distanceTo(controls.target)*.55));
    smoothCameraTo(target.clone().add(direction.multiplyScalar(distance)),target);
  }
}

function selectRoom(room){
  controls.minDistance=.3;controls.maxDistance=30;camera.position.set(room.x+3,7,room.z+5);controls.target.set(room.x,.2,room.z);controls.update();
  selectedRoom=room; roomMeshes.forEach(m=>{const c=m.userData.room; m.material.color.setHex(c.id===room.id?0xff606a:c.color);});
  $('#room-title').textContent=room.name+' · '+room.area; $('#room-description').textContent=room.description;
  document.querySelectorAll('.room-btn').forEach(b=>b.classList.toggle('active',b.dataset.room===room.id));
}
function buildRoomList(){
  const list=$('#room-list');list.replaceChildren();
  rooms.forEach(room=>{const b=document.createElement('button');b.className='room-btn';b.dataset.room=room.id;b.innerHTML=`<span>${room.name}</span><small>${room.area}</small>`;b.addEventListener('click',()=>{if(mode!=='apartment')setMode('apartment');selectRoom(room);});list.append(b);});
}
function resize(){if(!renderer)return;const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));fitScene();}
async function init(){
  try{
    const [three,orbit]=await Promise.all([import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'),import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js')]);
    THREE=three;OrbitControls=orbit.OrbitControls;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x071020);scene.fog=new THREE.Fog(0x071020,35,80);
    camera=new THREE.PerspectiveCamera(42,1,.1,150);camera.position.set(17,13,23);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;viewport.prepend(renderer.domElement);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=7;controls.maxDistance=42;
    scene.add(new THREE.HemisphereLight(0xc8e8ff,0x293348,2.1));const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(12,22,12);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);const fill=new THREE.PointLight(0x00cfff,25,45);fill.position.set(-10,9,-8);scene.add(fill);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),material('ground',0x17252b,.96));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);addNeighborhood();
    buildingGroup=new THREE.Group();scene.add(buildingGroup);floorGroups=[];floorCount=Number($('#floor-count').value);
    for(let i=0;i<floorCount;i++)addBuildingFloor(i);
    controls.target.set(0,floorCount*1.25,0);
    // Roof volume and entrance podium.
    box(buildingGroup,8.5,.28,7.4,0,floorCount*2.72,0,material('roof',0x263b54,.5));
    box(buildingGroup,9,.65,8,0,-.15,0,material('podium',0x607286,.75));
    makeApartment();updateFloorOpacity();buildRoomList();updateFloorButtons();fitScene();
    raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();let down=null;
    renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});
    renderer.domElement.addEventListener('pointermove',e=>{if(mode!=='building')return;if(!down)onSceneHover(e);else if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>=7)highlightFloor(-1);});
    renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7)onSceneClick(e);down=null;});
    renderer.domElement.addEventListener('pointercancel',()=>{down=null;highlightFloor(-1);});
    renderer.domElement.addEventListener('pointerleave',()=>{if(!down)highlightFloor(-1);});
    resize();window.addEventListener('resize',resize);loading.classList.add('hidden');
    $('#floor-count').addEventListener('change',()=>{floorCount=Number($('#floor-count').value);rebuildFloors();});
    $('#open-apartment').addEventListener('click',()=>setMode('apartment'));
    $('#show-all').onclick=()=>{selectedFloor=-1;setMode('building');updateFloorOpacity();fitScene();};
    $('#camera-side').onclick=()=>{fitScene('side');setCameraActive('camera-side');};$('#camera-rear').onclick=()=>{fitScene('rear');setCameraActive('camera-rear');};
    $('#view-structure').onclick=()=>{if(mode!=='apartment')return;const active=$('#view-structure').classList.toggle('active');apartmentGroup.children.forEach(o=>o.visible=!active||o.userData.structural);};
    $('#back-building').addEventListener('click',()=>setMode('building'));
    $('#view-plan').addEventListener('click',()=>{camera.position.set(0,18,.01);controls.target.set(0,0,0);controls.update();setActive('view-plan');});
    $('#view-perspective').addEventListener('click',()=>{camera.position.set(12,10,14);controls.target.set(0,0,0);controls.update();setActive('view-perspective');});
    $('#view-interior').addEventListener('click',()=>{const r=selectedRoom||rooms[0];controls.minDistance=.3;camera.position.set(r.x,1.55,r.z+.45);controls.target.set(r.x,1.4,r.z-.65);controls.update();setActive('view-interior');});
    $('#toggle-walls').addEventListener('click',()=>{transparentWalls=!transparentWalls;apartmentGroup.userData.walls.forEach(w=>{w.material.transparent=transparentWalls;w.material.opacity=transparentWalls?.2:1;});$('#toggle-walls').classList.toggle('active',transparentWalls);});
    $('#camera-orbit').addEventListener('click',()=>{cameraMode='orbit';fitScene('orbit');setCameraActive('camera-orbit');});
    $('#camera-front').addEventListener('click',()=>{cameraMode='front';fitScene('front');setCameraActive('camera-front');});
    $('#camera-top').addEventListener('click',()=>{cameraMode='top';fitScene('top');setCameraActive('camera-top');});
    $('#reset-camera').addEventListener('click',()=>fitScene());
    animate();
  }catch(error){console.error(error);loading.textContent='Não foi possível carregar o motor 3D. Verifique sua conexão com a internet e abra esta página por um servidor local (não diretamente pelo arquivo).';}
}
function setActive(id){['view-plan','view-perspective','view-interior'].forEach(k=>$('#'+k).classList.toggle('active',k===id));}
function setCameraActive(id){['camera-orbit','camera-front','camera-top','camera-side','camera-rear'].forEach(k=>$('#'+k).classList.toggle('active',k===id));}
function rebuildFloors(){
  buildingGroup.clear();floorGroups=[];floorCount=Number($('#floor-count').value);
  for(let i=0;i<floorCount;i++)addBuildingFloor(i);
  box(buildingGroup,8.5,.28,7.4,0,floorCount*2.72,0,material('roof',0x263b54,.5));box(buildingGroup,9,.65,8,0,-.15,0,material('podium',0x607286,.75));
  selectedFloor=Math.min(selectedFloor,floorCount-1);updateFloorOpacity();updateFloorButtons();selectFloor(selectedFloor);
  controls.target.set(0,floorCount*1.25,0);controls.update();if(mode==='apartment')setMode('building');
}
function setPointerFromEvent(event){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);}
function floorIndexFromHit(hit){let node=hit.object;while(node&&node!==buildingGroup){if(Number.isInteger(node.userData.floor))return node.userData.floor-1;node=node.parent;}return -1;}
function onSceneHover(event){
  if(mode!=='building')return;setPointerFromEvent(event);const hits=raycaster.intersectObjects(floorGroups,true);highlightFloor(hits.length?floorIndexFromHit(hits[0]):-1);
}
function onSceneClick(event){
  setPointerFromEvent(event);
  if(mode==='building'){
    const hits=raycaster.intersectObjects(floorGroups,true);
    if(hits.length){const index=floorIndexFromHit(hits[0]);if(index>=0){highlightFloor(-1);selectFloor(index,true);}}
    return;
  }
  const hits=raycaster.intersectObjects(roomMeshes,false);
  if(hits.length&&hits[0].object.userData.room)selectRoom(hits[0].object.userData.room);
}

function animate(){requestAnimationFrame(animate);if(controls)controls.update();if(renderer&&scene&&camera)renderer.render(scene,camera);}
init();

function fitScene(view='orbit'){
 if(!camera||!controls)return;
 const g=mode==='apartment'?apartmentGroup:buildingGroup;if(!g)return;
 const bounds=new THREE.Box3().setFromObject(g);if(bounds.isEmpty())return;
 const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const v=THREE.MathUtils.degToRad(camera.fov),h=2*Math.atan(Math.tan(v/2)*camera.aspect);
 const dist=size.length()/2/Math.sin(Math.min(v,h)/2)*1.12;
 const dirs={orbit:[1,.6,1.3],side:[1,.15,0],front:[0,.15,1],rear:[0,.15,-1],top:[0,1,0]};
 camera.position.copy(center).add(new THREE.Vector3(...(dirs[view]||dirs.orbit)).normalize().multiplyScalar(dist));
 controls.target.copy(center);controls.maxDistance=Math.max(100,dist*2);controls.update();
}
