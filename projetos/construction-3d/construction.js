const $ = (selector) => document.querySelector(selector);
let THREE, OrbitControls, renderer, scene, camera, controls, root;
let currentStage = 16, playing = false, playTimer = null, neighborhoodGroup;
let stageGroups = [], roofMeshes = [], pickables = [], raycaster, pointer;
let roofHidden = false, neighborhoodVisible = true, pointerDown = null;

const stages=[
 {name:'Preparação do terreno',description:'Organização inicial do lote, conferência das condições do terreno e preparação do canteiro para receber a obra.',services:'Vistoria do lote, análise do entorno, instalação do canteiro e sinalização.',materials:'Tapumes, placas, cones e itens de proteção coletiva.',equipment:'Trena, nível, ferramentas manuais e equipamentos de proteção.',importance:'Planejar o canteiro reduz riscos, organiza o fluxo de pessoas e melhora a sequência de execução.'},
 {name:'Limpeza do terreno',description:'Retirada de resíduos, vegetação superficial e materiais que possam interferir nos serviços seguintes.',services:'Roçada, remoção de entulho, segregação e destinação dos resíduos.',materials:'Sacos de descarte, caçamba e materiais de sinalização.',equipment:'Enxada, rastelo, carrinho de mão e ferramentas de limpeza.',importance:'Uma área limpa permite reconhecer o lote e preparar a implantação com segurança.'},
 {name:'Terraplanagem',description:'Regularização do solo para atingir níveis compatíveis com a implantação da residência.',services:'Corte, aterro, espalhamento, compactação e conferência dos níveis.',materials:'Solo selecionado e material granular para regularização, quando necessário.',equipment:'Mini carregadeira, compactador, pá e nível topográfico.',importance:'A preparação adequada do terreno contribui para estabilidade e drenagem da área construída.'},
 {name:'Locação da obra',description:'Transferência das dimensões e dos eixos do projeto para o terreno, marcando a posição da residência.',services:'Marcação de eixos, esquadro, alinhamentos e referências de nível.',materials:'Piquetes, linhas, sarrafos e tinta de marcação.',equipment:'Trena, esquadro, nível e estação total ou equipamento equivalente.',importance:'A locação orienta a execução e ajuda a evitar desvios de posição e dimensões.'},
 {name:'Escavação',description:'Abertura das valas e escavações nas posições definidas para receber os elementos de fundação.',services:'Escavação de valas, regularização do fundo e conferência das cotas.',materials:'Madeira para contenções locais e sinalização de segurança.',equipment:'Retroescavadeira ou ferramentas manuais, conforme o solo e a escala.',importance:'As dimensões e profundidades devem seguir o projeto de fundações e as condições verificadas no local.'},
 {name:'Fundação',description:'Execução dos elementos que transferem as cargas da residência para o solo.',services:'Montagem de formas e armaduras, posicionamento, concretagem e cura.',materials:'Concreto, aço para armaduras, formas e espaçadores.',equipment:'Betoneira ou concreto usinado, vibrador, ferramentas de armação.',importance:'A fundação é dimensionada conforme cargas, sondagem e características do solo por profissional habilitado.'},
 {name:'Estrutura',description:'Execução dos pilares, vigas e elementos estruturais que sustentam a edificação.',services:'Montagem de formas, armaduras, escoramentos e concretagem de pilares e vigas.',materials:'Concreto, aço, formas, escoras e espaçadores.',equipment:'Andaimes, vibrador de concreto, ferramentas e equipamentos de içamento adequados.',importance:'A estrutura garante o caminho das cargas até as fundações e deve seguir o projeto estrutural.'},
 {name:'Alvenaria',description:'Construção das paredes externas e divisórias internas, definindo os ambientes da casa.',services:'Elevação de paredes, vergas, contravergas e vãos para portas e janelas.',materials:'Blocos cerâmicos ou de concreto, argamassa e componentes de amarração.',equipment:'Colher de pedreiro, nível, prumo, linha e andaimes.',importance:'A alvenaria materializa a divisão dos ambientes e deve respeitar alinhamento, prumo e vãos de projeto.'},
 {name:'Instalações hidráulicas',description:'Passagem das tubulações de água fria, esgoto e pontos hidráulicos da residência.',services:'Distribuição de tubulações, conexões, registros e testes de estanqueidade.',materials:'Tubos, conexões, registros, caixas e adesivos apropriados.',equipment:'Cortador, ferramentas de montagem e equipamentos de teste.',importance:'As instalações precisam ser compatibilizadas com estrutura, arquitetura e pontos de utilização.'},
 {name:'Instalações elétricas',description:'Instalação de eletrodutos, caixas e caminhos para os circuitos elétricos.',services:'Passagem de eletrodutos, caixas de passagem e preparação dos circuitos.',materials:'Eletrodutos, caixas, quadros e cabos especificados em projeto.',equipment:'Passa-fios, ferramentas isoladas e instrumentos de medição.',importance:'A instalação deve seguir projeto elétrico, dimensionamento e normas de segurança aplicáveis.'},
 {name:'Cobertura',description:'Montagem da estrutura de cobertura e instalação das telhas, protegendo os ambientes.',services:'Montagem de estrutura, rufos, calhas e telhamento.',materials:'Madeira ou perfis metálicos, telhas, parafusos, rufos e calhas.',equipment:'Andaimes, ferramentas de corte e equipamentos de proteção contra quedas.',importance:'A cobertura protege a edificação da chuva e do sol e integra o sistema de drenagem pluvial.'},
 {name:'Revestimentos',description:'Regularização de superfícies, aplicação de chapisco, emboço, reboco e revestimentos de piso.',services:'Execução de camadas de revestimento, contrapiso e assentamento de pisos.',materials:'Argamassas, cerâmicas, rejunte e materiais de regularização.',equipment:'Desempenadeira, cortador de piso, nível e misturador.',importance:'Os revestimentos protegem superfícies e preparam os ambientes para os acabamentos finais.'},
 {name:'Esquadrias',description:'Instalação de portas, janelas e elementos de fechamento dos vãos.',services:'Fixação, alinhamento, vedação e regulagem de portas e janelas.',materials:'Esquadrias de alumínio ou madeira, vidros, dobradiças e selantes.',equipment:'Furadeira, nível, ferramentas de fixação e medição.',importance:'As esquadrias contribuem para segurança, iluminação, ventilação e conforto.'},
 {name:'Pintura',description:'Preparação das superfícies e aplicação de seladores, fundos e tintas.',services:'Lixamento, correção, selagem e aplicação das demãos de acabamento.',materials:'Massa, selador, lixas e tintas apropriadas.',equipment:'Rolos, pincéis, bandejas e equipamentos de proteção.',importance:'A pintura protege as superfícies e dá acabamento visual aos ambientes.'},
 {name:'Acabamentos',description:'Instalação dos componentes finais e montagem dos elementos internos da casa.',services:'Louças, metais, luminárias, rodapés, ferragens e ajustes finais.',materials:'Louças, metais, luminárias, ferragens, rodapés e acessórios.',equipment:'Ferramentas de instalação, medição e limpeza fina.',importance:'Os acabamentos tornam os ambientes utilizáveis e permitem verificar o funcionamento dos sistemas.'},
 {name:'Obras externas',description:'Execução de calçadas, acesso, drenagem superficial e paisagismo do lote.',services:'Pavimentação externa, organização do acesso, drenagem e plantio.',materials:'Pavers, concreto, solo vegetal, grama e espécies ornamentais.',equipment:'Compactador, ferramentas de jardinagem e equipamentos de acabamento.',importance:'As áreas externas organizam os acessos, ajudam no escoamento da água e integram a casa ao lote.'},
 {name:'Finalização e entrega',description:'Limpeza final, inspeções, testes dos sistemas e apresentação da residência concluída.',services:'Vistoria, testes, limpeza, correções e organização para entrega.',materials:'Materiais de limpeza, etiquetas e documentação técnica.',equipment:'Instrumentos de teste, ferramentas de inspeção e equipamentos de limpeza.',importance:'A entrega deve ocorrer após conferência dos serviços e documentação pertinente.'}
];

const material = (color, roughness = .78, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
const mats = {};
function box(parent, name, width, height, depth, x, y, z, mat, info = null) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  obj.name = name; obj.position.set(x, y, z); obj.castShadow = true; obj.receiveShadow = true;
  if (info) { obj.userData.info = info; pickables.push(obj); }
  parent.add(obj); return obj;
}
function cylinder(parent, name, topRadius, bottomRadius, height, x, y, z, mat, info = null, segments = 12) {
  const obj = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments), mat);
  obj.name = name; obj.position.set(x, y, z); obj.castShadow = true; obj.receiveShadow = true;
  if (info) { obj.userData.info = info; pickables.push(obj); }
  parent.add(obj); return obj;
}
function sphere(parent, name, radius, x, y, z, mat) {
  const obj = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), mat);
  obj.name = name; obj.position.set(x, y, z); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
}
function group(name, from = 0, to = 16, parent = root) {
  const g = new THREE.Group(); g.name = name; g.userData.from = from; g.userData.to = to; parent.add(g); stageGroups.push(g); return g;
}
function makeTree(parent, x, z, scale = 1, subdued = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); parent.add(g);
  cylinder(g, 'Tronco', .12, .18, 1.35, 0, .68, 0, mats.bark);
  sphere(g, 'Copa da árvore', .82, 0, 1.65, 0, subdued ? mats.neighborGreen : mats.leaf);
  sphere(g, 'Copa superior', .55, .2, 2.15, -.12, subdued ? mats.neighborGreen : mats.leaf2);
  return g;
}
function makeNeighborHouse(parent, x, z, variant = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const wallMat = variant ? mats.neighborWall2 : mats.neighborWall;
  const roofMat = variant ? mats.neighborRoof2 : mats.neighborRoof;
  box(g, 'Casa vizinha · volume', 7.4, 2.9, 6.2, 0, 1.48, 0, wallMat,
    {title:'Residência vizinha', description:'Construção de escala menor e contraste reduzido para contextualizar a casa principal.'});
  const roofL = box(g, 'Telhado vizinho esquerdo', 4.2, .22, 6.7, -1.8, 3.12, 0, roofMat);
  roofL.rotation.z = -.28;
  const roofR = box(g, 'Telhado vizinho direito', 4.2, .22, 6.7, 1.8, 3.12, 0, roofMat);
  roofR.rotation.z = .28;
  // Esquadrias frontais discretas.
  for (const wx of [-2.15, 2.15]) {
    box(g, 'Janela da casa vizinha', 1.25, 1.05, .08, wx, 1.85, 3.14, mats.neighborGlass);
    box(g, 'Peitoril da casa vizinha', 1.38, .09, .14, wx, 1.29, 3.15, mats.neighborTrim);
  }
  box(g, 'Porta vizinha', .92, 2.0, .1, 0, 1.02, 3.16, mats.neighborDoor);
  return g;
}
function wallSegment(parent, label, axis, length, x, y, z, mat, info) {
  const w = axis === 'x' ? length : .18;
  const d = axis === 'z' ? length : .18;
  return box(parent, label, w, 2.65, d, x, y, z, mat, info);
}
function windowFront(parent, x, z, width = 2.0, height = 1.3) {
  const y = 1.95;
  const glass = box(parent, 'Janela frontal', width, height, .09, x, y, z, mats.glass,
    {title:'Esquadria de alumínio e vidro', description:'Janela demonstrativa com caixilho, montantes e vidro. A dimensão é apenas ilustrativa.'});
  glass.material = mats.glass;
  const frameDepth = .15;
  box(parent, 'Marco superior da janela', width + .14, .09, frameDepth, x, y + height/2, z, mats.frame);
  box(parent, 'Marco inferior da janela', width + .14, .09, frameDepth, x, y - height/2, z, mats.frame);
  box(parent, 'Marco lateral da janela', .08, height, frameDepth, x - width/2, y, z, mats.frame);
  box(parent, 'Marco lateral da janela', .08, height, frameDepth, x + width/2, y, z, mats.frame);
  box(parent, 'Montante da janela', .055, height, frameDepth, x, y, z, mats.frame);
}
function createUrbanContext() {
  const ground = group('Terreno e paisagismo', 0, 16);
  box(ground, 'Base do terreno', 48, .35, 43, 0, -.34, 0, mats.ground);
  // Lote principal e faixa de jardim.
  box(ground, 'Lote residencial', 28, .12, 21, 0, -.08, -.65, mats.lot);
  box(ground, 'Gramado frontal', 25.5, .035, 4.6, 0, -.005, 7.85, mats.grass);
  // Meio-fio, calçada e rua.
  box(ground, 'Calçada em concreto', 48, .16, 2.0, 0, -.01, 10.1, mats.sidewalk);
  box(ground, 'Meio-fio', 48, .22, .18, 0, .02, 11.13, mats.curb);
  box(ground, 'Rua asfaltada', 48, .16, 7.0, 0, -.03, 14.65, mats.asphalt,
    {title:'Via pública', description:'Rua urbana representada em escala conceitual, com calçada e sinalização horizontal.'});
  // Faixas de sinalização e sarjeta.
  for (let x = -21; x <= 21; x += 7) box(ground, 'Faixa central da via', 3.2, .012, .12, x, .055, 14.65, mats.roadMark);
  box(ground, 'Sarjeta', 48, .045, .22, 0, .01, 11.35, mats.curb);
  // Limites baixos, pilares e entrada do lote.
  for (const x of [-13.3, 13.3]) {
    box(ground, 'Mureta lateral', .18, .65, 18.8, x, .28, -.65, mats.boundary);
    for (let z = -9; z <= 8; z += 4) box(ground, 'Pilar de divisa', .32, .85, .32, x, .36, z, mats.boundary);
  }
  for (const x of [-13.3, -9.5, 9.5, 13.3]) box(ground, 'Mureta frontal', 3.8, .55, .16, x, .23, 9.55, mats.boundary);
  // Passeio de acesso e placas de piso.
  for (let i = 0; i < 7; i++) box(ground, 'Placa do caminho de entrada', 1.05, .08, .78, -.55, .035, 8.7 - i * .82, mats.paver);

  neighborhoodGroup = new THREE.Group(); neighborhoodGroup.name = 'Vizinhança'; root.add(neighborhoodGroup);
  makeNeighborHouse(neighborhoodGroup, -18.5, -2.3, 0);
  makeNeighborHouse(neighborhoodGroup, 18.5, -2.3, 1);
  for (const x of [-22, -14.5, 14.5, 22]) makeTree(neighborhoodGroup, x, 8.9, .8, true);
  for (const x of [-11.5, 11.5]) makeTree(neighborhoodGroup, x, -7.7, .85, true);
  // Postes e iluminação pública.
  for (const x of [-10.5, 10.5]) {
    cylinder(neighborhoodGroup, 'Poste de iluminação', .055, .075, 4.7, x, 2.35, 10.1, mats.lampPole);
    const arm = box(neighborhoodGroup, 'Braço do poste', .85, .07, .07, x + (x < 0 ? .35 : -.35), 4.55, 10.1, mats.lampPole);
    sphere(neighborhoodGroup, 'Luminária', .16, x + (x < 0 ? .72 : -.72), 4.48, 10.1, mats.lampGlow);
  }
  // Carro simplificado para dar escala à rua sem competir com a casa.
  const car = new THREE.Group(); car.position.set(7.0, .03, 14.4); neighborhoodGroup.add(car);
  box(car, 'Carro estacionado', 2.0, .62, 3.7, 0, .55, 0, mats.carPaint,
    {title:'Veículo na via', description:'Elemento de ambientação para dar escala à rua. Não faz parte do lote da residência.'});
  box(car, 'Teto do carro', 1.65, .62, 1.85, 0, 1.12, -.25, mats.carGlass);
  for (const wx of [-.85, .85]) for (const wz of [-1.15, 1.15]) {
    const wheel = cylinder(car, 'Roda do veículo', .38, .38, .18, wx, .34, wz, mats.tire, null, 18);
    wheel.rotation.z = Math.PI / 2;
  }
  // Árvores do jardim da própria casa.
  for (const [x,z,s] of [[-11,6.2,.85],[11,6.5,.72],[-10,-7.2,.7],[10,-7.1,.7]]) makeTree(ground, x, z, s, false);
  // Placas e pequenas áreas verdes.
  for (const x of [-8.5, 8.5]) {
    box(ground, 'Canteiro lateral', 2.1, .09, 5.8, x, .05, 1.0, mats.grass);
    for (let i = 0; i < 4; i++) sphere(ground, 'Arbusto do jardim', .42, x, .36, -1.1 + i * 1.2, mats.shrub);
  }
  return ground;
}
function createConstructionStages() {
  // 01 — Implantação e canteiro.
  const prep = group('Etapa 01 · Preparação', 0, 0);
  for (let z = -8.4; z <= 7.4; z += 2.0) {
    cylinder(prep, 'Estaca do tapume', .055, .055, 1.7, -12.5, .85, z, mats.wood);
    box(prep, 'Painel de tapume', .08, 1.45, 1.85, -12.5, .78, z + .92, mats.fence);
  }
  box(prep, 'Container de apoio', 3.4, 2.25, 2.3, -8.9, 1.1, -6.1, mats.container,
    {title:'Container de apoio', description:'Estrutura temporária de apoio ao canteiro de obras.'});
  box(prep, 'Placa de obra', 1.45, .92, .09, -6.5, 1.65, -6.05, mats.sign,
    {title:'Sinalização do canteiro', description:'Placa demonstrativa de identificação e organização da obra.'});
  box(prep, 'Pallet de materiais', 1.7, .18, 1.25, 8.5, .12, -6.0, mats.wood);
  for (let i=0;i<4;i++) box(prep, 'Saco de material', .48, .42, .52, 8.0 + (i%2)*.55, .42, -6.0 + Math.floor(i/2)*.55, mats.sack);

  // 02 — Limpeza.
  const clean = group('Etapa 02 · Limpeza', 1, 1);
  box(clean, 'Caçamba de resíduos', 2.5, 1.15, 1.65, 10.1, .62, -5.4, mats.skip,
    {title:'Caçamba de resíduos', description:'Ponto de coleta e retirada dos resíduos gerados durante a limpeza do terreno.'});
  for (let i=0;i<7;i++) sphere(clean, 'Resíduo de limpeza', .18, -8 + i*1.1, .12, 4.8 + (i%2)*.6, mats.rubble);

  // 03 — Regularização do solo.
  const grade = group('Etapa 03 · Terraplanagem', 2, 3);
  box(grade, 'Área regularizada', 11.5, .14, 8.4, 0, .02, -.35, mats.compactedSoil,
    {title:'Solo regularizado', description:'Superfície de implantação preparada para receber locação, escavações e fundações.'});
  for (let i=0;i<4;i++) box(grade, 'Faixa de nivelamento', 10.7, .025, .035, 0, .105, -3.1 + i*1.8, mats.levelLine);

  // 04 — Marcação dos eixos.
  const layout = group('Etapa 04 · Locação', 3, 3);
  for (const x of [-5.1,5.1]) for (const z of [-3.65,3.65]) {
    cylinder(layout, 'Piquete de locação', .055, .07, .92, x, .46, z, mats.wood);
    box(layout, 'Tábua de locação', .12, .12, .8, x, .83, z, mats.wood);
  }
  for (const x of [-5.1,5.1]) box(layout, 'Linha de locação', .035, .035, 7.5, x, .9, 0, mats.string);
  for (const z of [-3.65,3.65]) box(layout, 'Linha de locação', 10.3, .035, .035, 0, .9, z, mats.string);

  // 05 — Escavação das valas.
  const excavation = group('Etapa 05 · Escavação', 4, 4);
  for (const x of [-5,5]) for (const z of [-3.5,3.5]) box(excavation, 'Escavação de bloco', .95, .42, .95, x, -.02, z, mats.trench);
  for (const z of [-3.5,3.5]) box(excavation, 'Vala de fundação', 10, .42, .55, 0, -.02, z, mats.trench);
  for (const x of [-5,5]) box(excavation, 'Vala de fundação', .55, .42, 7, x, -.02, 0, mats.trench);

  // 06 — Fundação.
  const foundation = group('Etapa 06 · Fundação', 5, 16);
  for (const x of [-5,0,5]) for (const z of [-3.5,3.5]) box(foundation, 'Sapata de concreto', 1.0, .42, 1.0, x, .12, z, mats.concrete,
    {title:'Fundação em concreto', description:'Elemento conceitual de fundação. O dimensionamento real depende de sondagem, cargas e projeto estrutural.'});
  for (const z of [-3.5,3.5]) box(foundation, 'Viga baldrame', 10.2, .38, .48, 0, .35, z, mats.darkConcrete);
  for (const x of [-5,5]) box(foundation, 'Viga baldrame', .48, .38, 7.0, x, .35, 0, mats.darkConcrete);

  // 07 — Estrutura principal.
  const structure = group('Etapa 07 · Estrutura', 6, 16);
  box(structure, 'Laje do piso', 10.1, .2, 7.1, 0, .58, -.15, mats.slab,
    {title:'Laje de piso', description:'Base estrutural demonstrativa que recebe as vedações e os acabamentos internos.'});
  for (const x of [-4.85,0,4.85]) for (const z of [-3.35,3.05]) box(structure, 'Pilar estrutural', .28, 2.9, .28, x, 2.12, z, mats.concrete,
    {title:'Pilar estrutural', description:'Representação de pilar em concreto armado. Seção e armaduras não estão dimensionadas.'});
  box(structure, 'Viga superior frontal', 10.0, .28, .3, 0, 3.52, 3.05, mats.darkConcrete);
  box(structure, 'Viga superior posterior', 10.0, .28, .3, 0, 3.52, -3.35, mats.darkConcrete);
  box(structure, 'Viga superior lateral', .3, .28, 6.7, -4.85, 3.52, -.15, mats.darkConcrete);
  box(structure, 'Viga superior lateral', .3, .28, 6.7, 4.85, 3.52, -.15, mats.darkConcrete);

  // 08 — Alvenaria, em trechos que reservam os vãos principais.
  const masonry = group('Etapa 08 · Alvenaria', 7, 10);
  const brickInfo = {title:'Alvenaria de vedação', description:'Paredes demonstrativas com vãos reservados para portas e janelas. Não representam detalhamento executivo.'};
  const wallY = 1.92;
  wallSegment(masonry,'Parede frontal esquerda','x',1.25,-4.35,wallY,3.22,mats.brick,brickInfo);
  wallSegment(masonry,'Parede frontal central','x',3.0,-.95,wallY,3.22,mats.brick,brickInfo);
  wallSegment(masonry,'Parede frontal direita','x',2.0,4.0,wallY,3.22,mats.brick,brickInfo);
  wallSegment(masonry,'Parede posterior esquerda','x',1.85,-4.08,wallY,-3.48,mats.brick,brickInfo);
  wallSegment(masonry,'Parede posterior direita','x',6.2,1.9,wallY,-3.48,mats.brick,brickInfo);
  wallSegment(masonry,'Parede lateral esquerda','z',7.0,-4.92,wallY,-.13,mats.brick,brickInfo);
  wallSegment(masonry,'Parede lateral direita','z',7.0,4.92,wallY,-.13,mats.brick,brickInfo);
  wallSegment(masonry,'Divisória interna','z',6.8,.35,wallY,-.13,mats.brick,brickInfo);
  wallSegment(masonry,'Divisória de ambientes','x',3.8,-2.55,wallY,-.55,mats.brick,brickInfo);
  wallSegment(masonry,'Divisória curta','x',2.1,2.05,wallY,-1.5,mats.brick,brickInfo);

  // 09 — Hidráulica.
  const plumbing = group('Etapa 09 · Hidráulica', 8, 10);
  const pipeA = cylinder(plumbing,'Tubulação hidráulica',.075,.075,5.6,3.95,1.55,-.7,mats.pipeBlue,{title:'Tubulação hidráulica',description:'Traçado ilustrativo de tubulação de água e pontos de distribuição.'}); pipeA.rotation.z=Math.PI/2;
  const pipeB = cylinder(plumbing,'Coluna hidráulica',.075,.075,2.7,3.95,1.65,-2.5,mats.pipeBlue); pipeB.rotation.z=Math.PI/2;
  for (const z of [-2.7,-.4,2.0]) cylinder(plumbing,'Ramal hidráulico',.055,.055,1.8,3.95,1.4,z,mats.pipeBlue);
  cylinder(plumbing,'Coluna de esgoto',.09,.09,2.2,-3.8,1.35,-2.1,mats.pipeGreen);

  // 10 — Elétrica.
  const electrical = group('Etapa 10 · Elétrica', 9, 10);
  for (const [x,z] of [[-4.7,-2.7],[-4.7,1.7],[4.65,-2.4],[.35,2.2]]) {
    const conduit = cylinder(electrical,'Eletroduto',.045,.045,2.2,x,2.1,z,mats.wire); conduit.rotation.z=Math.PI/2;
    box(electrical,'Caixa elétrica',.2,.2,.12,x,2.2,z+.08,mats.electricBox);
  }
  // 11 — Cobertura.
  const roofStage = group('Etapa 11 · Cobertura', 10, 16);
  const mainRoof = box(roofStage,'Cobertura principal',10.85,.28,7.85,0,3.95,-.15,mats.roof,
    {title:'Cobertura da residência',description:'Cobertura plana contemporânea com platibanda e acabamento superior. Ative “Ver interior” para observar os ambientes.'});
  roofMeshes.push(mainRoof);
  for (const [w,h,d,x,y,z] of [[10.9,.42,.22,0,3.77,3.72],[10.9,.42,.22,0,3.77,-4.02],[.22,.42,7.7,-5.35,3.77,-.15],[.22,.42,7.7,5.35,3.77,-.15]]) {
    const parapet = box(roofStage,'Platibanda',w,h,d,x,y,z,mats.roofEdge,{title:'Platibanda',description:'Arremate perimetral da cobertura plana.'}); roofMeshes.push(parapet);
  }
  // 12 — Revestimentos: troca da alvenaria aparente por superfícies rebocadas.
  const plaster = group('Etapa 12 · Revestimentos', 11, 16);
  const plasterInfo = {title:'Revestimento de fachada',description:'Camada de regularização e acabamento aplicada sobre a alvenaria.'};
  wallSegment(plaster,'Fachada frontal esquerda','x',1.25,-4.35,wallY,3.34,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada frontal central','x',3.0,-.95,wallY,3.34,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada frontal direita','x',2.0,4.0,wallY,3.34,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada posterior esquerda','x',1.85,-4.08,wallY,-3.59,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada posterior direita','x',6.2,1.9,wallY,-3.59,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada lateral esquerda','z',7.0,-5.04,wallY,-.13,mats.plaster,plasterInfo);
  wallSegment(plaster,'Fachada lateral direita','z',7.0,5.04,wallY,-.13,mats.plaster,plasterInfo);
  wallSegment(plaster,'Divisória interna acabada','z',6.8,.35,wallY,-.13,mats.innerWall,plasterInfo);
  wallSegment(plaster,'Divisória de ambientes acabada','x',3.8,-2.55,wallY,-.55,mats.innerWall,plasterInfo);
  wallSegment(plaster,'Divisória curta acabada','x',2.1,2.05,wallY,-1.5,mats.innerWall,plasterInfo);
  box(plaster,'Piso interno acabado',9.75,.08,6.78,0,.72,-.15,mats.floor,
    {title:'Piso interno',description:'Acabamento de piso demonstrativo em tom amadeirado claro.'});

  // 13 — Esquadrias e portas.
  const frames = group('Etapa 13 · Esquadrias', 12, 16);
  windowFront(frames,1.55,3.41,2.0,1.3);
  windowFront(frames,-2.25,-3.63,2.1,1.25);
  box(frames,'Porta principal',1.05,2.18,.13,-3.05,1.85,3.48,mats.door,
    {title:'Porta principal',description:'Porta de acesso com acabamento amadeirado, puxador e marco.'});
  box(frames,'Puxador da porta',.055,.48,.06,-3.42,1.85,3.57,mats.handle);
  // Janela lateral e porta de serviço.
  box(frames,'Janela lateral',.09,1.2,1.7,-5.08,1.9,-1.3,mats.glass,{title:'Janela lateral',description:'Abertura lateral para iluminação e ventilação.'});
  box(frames,'Caixilho lateral',.12,1.35,1.85,-5.13,1.9,-1.3,mats.frame);
  box(frames,'Porta de serviço',.12,2.08,.92,4.98,1.8,-2.55,mats.door);

  // 14 — Pintura e identidade da fachada.
  const painting = group('Etapa 14 · Pintura', 13, 16);
  box(painting,'Painel de destaque da fachada',2.0,2.55,.08,3.75,1.95,3.49,mats.accent,
    {title:'Painel de fachada',description:'Plano de destaque em cor mineral para criar profundidade e identidade visual.'});
  box(painting,'Friso horizontal da fachada',10.1,.08,.12,0,3.27,3.48,mats.trim);
  box(painting,'Faixa de acabamento lateral',.08,.11,6.9,5.13,3.25,-.1,mats.trim);

  // 15 — Acabamentos internos, louças e mobiliário.
  const finish = group('Etapa 15 · Acabamentos', 14, 16);
  // Estar: tapete, sofá em L e mesa.
  box(finish,'Tapete da sala',3.35,.035,2.5,2.55,.79,1.45,mats.rug);
  box(finish,'Sofá · base',2.55,.42,.88,2.45,1.0,2.0,mats.sofa);
  box(finish,'Sofá · encosto',2.55,.82,.22,2.45,1.43,2.36,mats.sofaBack);
  box(finish,'Sofá · chaise',.85,.42,1.65,3.28,1.0,1.22,mats.sofa);
  for (let i=0;i<3;i++) box(finish,'Almofada do sofá',.58,.16,.55,1.55+i*.78,1.48,2.22,mats.cushion);
  box(finish,'Mesa de centro',1.35,.12,.78,2.25,.98,.75,mats.woodTop);
  for (const x of [1.7,2.8]) for (const z of [.48,1.02]) cylinder(finish,'Pé da mesa de centro',.035,.035,.42,x,.76,z,mats.darkMetal);
  // Jantar.
  box(finish,'Mesa de jantar',1.8,.12,1.0,-2.65,1.55,1.1,mats.woodTop);
  for (const x of [-3.35,-1.95]) for (const z of [.35,1.85]) {
    box(finish,'Cadeira · assento',.48,.12,.48,x,1.05,z,mats.chair);
    box(finish,'Cadeira · encosto',.48,.65,.1,x,1.4,z+(z<1?.2:-.2),mats.chair);
  }
  // Cozinha e bancada.
  box(finish,'Armário inferior da cozinha',3.0,.85,.62,-3.25,1.2,-2.55,mats.kitchen);
  box(finish,'Bancada da cozinha',3.15,.12,.72,-3.25,1.68,-2.55,mats.counter);
  box(finish,'Cooktop',.72,.06,.48,-3.65,1.78,-2.55,mats.darkMetal);
  box(finish,'Geladeira',.75,1.9,.72,-4.35,1.72,-1.45,mats.appliance,
    {title:'Geladeira',description:'Equipamento de cozinha representado em escala visual.'});
  // Dormitório.
  box(finish,'Base da cama',2.05,.34,1.65,2.7,.98,-2.4,mats.bedBase);
  box(finish,'Colchão',1.98,.24,1.58,2.7,1.25,-2.4,mats.bed);
  box(finish,'Cabeceira',2.1,1.0,.14,2.7,1.48,-3.16,mats.wood);
  for (const x of [2.15,2.9]) box(finish,'Travesseiro',.62,.12,.38,x,1.43,-2.85,mats.linen);
  box(finish,'Mesa de cabeceira',.55,.5,.5,4.1,1.05,-3.0,mats.woodTop);
  // Banheiro ilustrativo.
  box(finish,'Bancada do banheiro',1.45,.14,.58,-3.25,1.1,-.15,mats.counter);
  box(finish,'Cuba do banheiro',.58,.13,.38,-3.25,1.22,-.15,mats.sink);
  cylinder(finish,'Vaso sanitário',.27,.3,.48,-4.0,.98,-1.7,mats.sanitary);
  box(finish,'Caixa acoplada',.55,.58,.23,-4.0,1.37,-1.93,mats.sanitary);
  box(finish,'Box do banheiro',1.25,2.0,.055,-2.0,1.75,-2.25,mats.glass);
  // Iluminação e objetos decorativos.
  for (const [x,z] of [[-2.7,1.1],[2.4,1.2],[2.6,-2.2]]) {
    cylinder(finish,'Luminária de teto',.12,.12,.08,x,3.35,z,mats.lampGlow);
  }
  for (const [x,z] of [[-4.2,2.4],[4.1,1.4]]) {
    cylinder(finish,'Vaso decorativo',.18,.22,.35,x,.98,z,mats.planter);
    sphere(finish,'Planta decorativa',.38,x,1.38,z,mats.shrub);
  }

  // 16 — Obras externas, piso e paisagismo.
  const external = group('Etapa 16 · Obras externas', 15, 16);
  box(external,'Pátio de acesso',5.6,.12,3.0,-.1,.06,5.0,mats.paver,
    {title:'Pátio e acesso',description:'Pavimentação de acesso entre a residência, o jardim frontal e a calçada.'});
  box(external,'Garagem descoberta',3.4,.12,5.5,7.2,.05,5.4,mats.paver);
  for (let i=0;i<8;i++) box(external,'Placa do caminho',.95,.08,.78,-.55,.12,8.45-i*.82,mats.stone);
  for (const x of [-7.6,7.6]) {
    box(external,'Canteiro frontal',2.4,.12,3.5,x,.06,6.0,mats.grass);
    for (let i=0;i<5;i++) sphere(external,'Arbusto ornamental',.34,x+(i%2)*.55-.25,.38,4.8+Math.floor(i/2)*.85,mats.shrub);
  }
  for (const [x,z] of [[-4.5,5.8],[4.6,6.0]]) makeTree(external,x,z,.55,false);
  // 17 — Entrega, iluminação e pequenos detalhes finais.
  const delivery = group('Etapa 17 · Entrega', 16, 16);
  for (const [x,z] of [[-4.6,3.8],[4.6,3.8],[-8.8,8.0],[8.8,8.0]]) {
    cylinder(delivery,'Balizador de jardim',.045,.065,.75,x,.38,z,mats.lampPole);
    sphere(delivery,'Luz do balizador',.11,x,.78,z,mats.lampGlow);
  }
  // Painéis solares discretos na cobertura.
  for (let i=0;i<3;i++) {
    const panel = box(delivery,'Painel solar',1.35,.055,1.0,-2.4+i*1.55,4.13,-1.25,mats.solar,
      {title:'Painel solar',description:'Painel fotovoltaico ilustrativo sobre a cobertura. Não representa dimensionamento de geração.'});
    panel.rotation.x=-.04;
  }
  box(delivery,'Número da residência',.55,.38,.06,4.55,2.4,3.52,mats.houseNumber);
}
function configureMaterials() {
  mats.ground=material(0x344238); mats.lot=material(0x77846a); mats.grass=material(0x617c55);
  mats.sidewalk=material(0xaeb5b2); mats.curb=material(0x838f91); mats.asphalt=material(0x303b44,.95);
  mats.roadMark=material(0xd9d9ce); mats.boundary=material(0xb6b4a8); mats.paver=material(0x858f91);
  mats.stone=material(0xb5b8ac); mats.bark=material(0x70523c); mats.leaf=material(0x477453); mats.leaf2=material(0x668a59); mats.neighborGreen=material(0x526e59);
  mats.shrub=material(0x527b55); mats.wood=material(0x98704d); mats.fence=material(0x687b83); mats.container=material(0x597d84,.65,.18);
  mats.sign=material(0xe2d4ac); mats.sack=material(0xb4a487); mats.skip=material(0x596f79); mats.rubble=material(0x8b7863);
  mats.compactedSoil=material(0x927b5d); mats.levelLine=material(0xc3a36d); mats.string=material(0xe7b85f);
  mats.trench=material(0x554737); mats.concrete=material(0x9ba5aa); mats.darkConcrete=material(0x657580); mats.slab=material(0xaab0ac);
  mats.brick=material(0xa96e50); mats.pipeBlue=material(0x358bc1,.35,.2); mats.pipeGreen=material(0x3e9b83,.35,.2); mats.wire=material(0xe5be55,.4,.12); mats.electricBox=material(0xd9d4bd);
  mats.roof=material(0x394957,.55,.22); mats.roofEdge=material(0x283a47,.62,.12); mats.plaster=material(0xd8d4c8); mats.innerWall=material(0xe8e1d3);
  mats.floor=material(0xb58c63); mats.glass=new THREE.MeshPhysicalMaterial({color:0x8acbd4,roughness:.16,metalness:.12,transparent:true,opacity:.62,side:THREE.DoubleSide});
  mats.frame=material(0x465b67,.45,.5); mats.door=material(0x76543b); mats.handle=material(0xc4b18b,.25,.75); mats.accent=material(0x9c8066); mats.trim=material(0xc5b59c);
  mats.rug=material(0x6e7f83); mats.sofa=material(0x637c83); mats.sofaBack=material(0x506872); mats.cushion=material(0xc5b18e); mats.woodTop=material(0x94704e); mats.darkMetal=material(0x303d45,.35,.65); mats.chair=material(0x806246);
  mats.kitchen=material(0x9b9c8c); mats.counter=material(0xc5c4b8); mats.appliance=material(0xbac4c7,.26,.25); mats.bedBase=material(0x806a56); mats.bed=material(0xd9d6ca); mats.linen=material(0xf1eadf); mats.sink=material(0xe5e9e4,.2,.05); mats.sanitary=material(0xf0f0e9,.18,.02);
  mats.planter=material(0x9a846d); mats.lampPole=material(0x313f49,.4,.6); mats.lampGlow=new THREE.MeshStandardMaterial({color:0xffe2a9,emissive:0xffbd70,emissiveIntensity:.6});
  mats.solar=material(0x244c68,.3,.55); mats.houseNumber=material(0x2e3e46);
  mats.neighborWall=material(0xaaa89a); mats.neighborWall2=material(0xb3a18e); mats.neighborRoof=material(0x626963); mats.neighborRoof2=material(0x71685f); mats.neighborGlass=material(0x667e85); mats.neighborTrim=material(0x7e867f); mats.neighborDoor=material(0x72604c); mats.carPaint=material(0x677982,.32,.48); mats.carGlass=material(0x384d59,.25,.3); mats.tire=material(0x20272b,.9);
}
function buildTimeline() {
  const timeline=$('#stage-timeline'); timeline.innerHTML='';
  stages.forEach((stage,index)=>{
    const button=document.createElement('button'); button.type='button'; button.className='stage-btn';
    button.innerHTML=`<small>ETAPA ${String(index+1).padStart(2,'0')}</small><strong>${stage.name}</strong>`;
    button.addEventListener('click',()=>{pause();selectStage(index);});
    timeline.append(button);
  });
}
function selectStage(index) {
  currentStage=Math.max(0,Math.min(stages.length-1,index));
  stageGroups.forEach(g=>{const from=g.userData.from??0,to=g.userData.to??16;g.visible=currentStage>=from&&currentStage<=to;});
  const s=stages[currentStage];
  $('#stage-name').textContent=s.name; $('#stage-description').textContent=s.description;
  $('#stage-services').textContent=s.services; $('#stage-materials').textContent=s.materials;
  $('#stage-equipment').textContent=s.equipment; $('#stage-importance').textContent=s.importance;
  const progress=Math.round(currentStage/(stages.length-1)*100);
  $('#stage-progress').textContent=progress+'%'; $('#stage-number').textContent=String(currentStage+1).padStart(2,'0')+' / '+stages.length;
  $('#progress-fill').style.width=progress+'%'; $('#scene-stage-title').textContent=s.name;
  $('#scene-stage-subtitle').textContent=currentStage===16?'Residência concluída · lote urbano com vizinhança':'Etapa '+String(currentStage+1).padStart(2,'0')+' · evolução da residência';
  $('#timeline-count').textContent=String(currentStage+1).padStart(2,'0')+' de '+stages.length+' etapas';
  document.querySelectorAll('.stage-btn').forEach((button,i)=>{button.classList.toggle('active',i===currentStage);button.setAttribute('aria-current',i===currentStage?'step':'false');});
  $('#toggle-roof').disabled=currentStage<10;
  applyRoofVisibility();
}
function pause() {
  playing=false; clearInterval(playTimer); playTimer=null; $('#play-sim').textContent='▶ Simular obra';
}
function play() {
  if(playing){pause();return;}
  if(currentStage>=stages.length-1) selectStage(0);
  playing=true; $('#play-sim').textContent='Ⅱ Pausar';
  playTimer=setInterval(()=>{
    if(currentStage>=stages.length-1){pause();return;}
    selectStage(currentStage+1);
    if(currentStage>=stages.length-1) pause();
  },Number($('#sim-speed').value));
}
function applyRoofVisibility() {
  roofMeshes.forEach(mesh=>mesh.visible=!roofHidden&&currentStage>=10);
  $('#toggle-roof').setAttribute('aria-pressed',String(roofHidden));
  $('#toggle-roof').textContent=roofHidden?'Mostrar cobertura':'Ver interior';
  $('#scene-tip').textContent=roofHidden?'Cobertura oculta para facilitar a leitura dos ambientes internos.':'Dica: use “Ver interior” para visualizar a distribuição dos ambientes.';
}
function setCamera(mode) {
  const target=new THREE.Vector3(0,1.25,0);
  const positions={orbit:new THREE.Vector3(18,14,22),front:new THREE.Vector3(0,7.5,26),side:new THREE.Vector3(27,8,1),top:new THREE.Vector3(.1,31,.1)};
  camera.position.copy(positions[mode]||positions.orbit); controls.target.copy(target); controls.update();
  ['orbit','front','side','top'].forEach(k=>$('#cam-'+(k==='orbit'?'orbit':k)).classList.toggle('active',k===mode));
}
function showObjectInfo(info) {
  $('#object-title').textContent=info.title; $('#object-description').textContent=info.description;
}
function findPick(event) {
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const visiblePicks=pickables.filter(obj=>{let node=obj;while(node){if(!node.visible)return false;node=node.parent;}return true;});
  return raycaster.intersectObjects(visiblePicks,false)[0]?.object||null;
}
function attachPicking() {
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY,id:event.pointerId};});
  canvas.addEventListener('pointerup',event=>{
    if(!pointerDown||pointerDown.id!==event.pointerId)return;
    const moved=Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y);pointerDown=null;
    if(moved>7)return;
    const hit=findPick(event);if(hit?.userData.info)showObjectInfo(hit.userData.info);
  });
  canvas.addEventListener('pointermove',event=>{
    if(pointerDown)return;
    const hit=findPick(event);canvas.style.cursor=hit?.userData.info?'pointer':'grab';
  });
  canvas.addEventListener('pointerleave',()=>{canvas.style.cursor='grab';});
}
function resize() {
  if(!renderer||!camera)return;
  const viewport=$('#construction-viewport');const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);
  camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
}
function animate() {
  requestAnimationFrame(animate);
  if(controls)controls.update();
  if(renderer&&scene&&camera)renderer.render(scene,camera);
}
async function init() {
  try {
    const [threeModule,orbitModule]=await Promise.all([
      import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'),
      import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js')
    ]);
    THREE=threeModule;OrbitControls=orbitModule.OrbitControls;configureMaterials();
    scene=new THREE.Scene();scene.background=new THREE.Color(0x101d2b);scene.fog=new THREE.Fog(0x101d2b,48,95);
    camera=new THREE.PerspectiveCamera(42,1,.1,150);camera.position.set(18,14,22);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    $('#construction-viewport').prepend(renderer.domElement);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;
    controls.minDistance=8;controls.maxDistance=54;controls.maxPolarAngle=Math.PI*.485;controls.target.set(0,1.1,0);
    scene.add(new THREE.HemisphereLight(0xeaf4ff,0x65715d,2.0));
    const sun=new THREE.DirectionalLight(0xffe3bd,3.0);sun.position.set(-16,26,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-34;sun.shadow.camera.right=34;sun.shadow.camera.top=34;sun.shadow.camera.bottom=-34;sun.shadow.bias=-.00015;scene.add(sun);
    const fill=new THREE.DirectionalLight(0x85c9e8,1.0);fill.position.set(18,11,-14);scene.add(fill);
    const warm=new THREE.PointLight(0xffc98c,26,28);warm.position.set(-3,8,8);scene.add(warm);
    root=new THREE.Group();scene.add(root);raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
    createUrbanContext();createConstructionStages();buildTimeline();
    $('#construction-loading').classList.add('hidden');
    $('#play-sim').addEventListener('click',play);
    $('#prev-stage').addEventListener('click',()=>{pause();selectStage(currentStage-1);});
    $('#next-stage').addEventListener('click',()=>{pause();selectStage(currentStage+1);});
    $('#reset-sim').addEventListener('click',()=>{pause();roofHidden=false;selectStage(16);setCamera('orbit');});
    $('#sim-speed').addEventListener('change',()=>{if(playing){pause();play();}});
    $('#cam-orbit').addEventListener('click',()=>setCamera('orbit'));
    $('#cam-front').addEventListener('click',()=>setCamera('front'));
    $('#cam-side').addEventListener('click',()=>setCamera('side'));
    $('#cam-top').addEventListener('click',()=>setCamera('top'));
    $('#cam-reset').addEventListener('click',()=>{controls.target.set(0,1.25,0);camera.position.set(18,14,22);controls.update();setCamera('orbit');});
    $('#toggle-roof').addEventListener('click',()=>{if(currentStage<10)return;roofHidden=!roofHidden;applyRoofVisibility();});
    $('#toggle-neighborhood').addEventListener('click',()=>{neighborhoodVisible=!neighborhoodVisible;neighborhoodGroup.visible=neighborhoodVisible;$('#toggle-neighborhood').setAttribute('aria-pressed',String(neighborhoodVisible));$('#toggle-neighborhood').textContent=neighborhoodVisible?'Ocultar vizinhança':'Mostrar vizinhança';});
    attachPicking();selectStage(16);resize();window.addEventListener('resize',resize);animate();
  } catch(error) {
    console.error('Falha ao iniciar Construction 3D:',error);
    $('#construction-loading').innerHTML='<strong>Não foi possível carregar a cena 3D.</strong><small>Verifique a conexão com a internet e confirme se o navegador permite WebGL. Os arquivos locais do projeto foram carregados.</small>';
  }
}
init();
