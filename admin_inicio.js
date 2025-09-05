// ---------------------------
// Configuración Firebase
// ---------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ---------------------------
// Variables globales
// ---------------------------
const correoAdmin = localStorage.getItem("correoMaestro") || "";
const listaMaestros = document.getElementById("listaMaestros");
const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><circle cx="100" cy="70" r="40" fill="%23cbd5e1"/><ellipse cx="100" cy="145" rx="60" ry="28" fill="%23cbd5e1"/></svg>';
let solicitudesArray = [];

// Escapar HTML
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ---------------------------
// Menú hamburguesa
// ---------------------------
function mostrarMenu() {
  const menu = document.getElementById("menuHamburguesa");
  menu.classList.toggle("menu-visible");

  if (!menu.classList.contains("menu-visible")) return;

  let contenido = `
    <p><strong>Administrador:</strong><br>${escapeHtml(correoAdmin)}</p>
    <div style="margin-top: 15px;">
      <button id="btnSolicitudes" style="
        background-color: #005599;
        color: white;
        padding: 10px 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        font-size: 15px;
      ">Solicitudes</button>
    </div>
  `;

  // Mostrar "Alta Usuario" solo para superusuario
  if (correoAdmin === "21387744@uagro.mx") {
    contenido += `
      <div style="margin-top: 10px;">
        <button onclick="irAltaUsuario()" style="
          background-color: #008000;
          color: white;
          padding: 10px 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          font-size: 15px;
        ">Alta Usuario</button>
      </div>
    `;
  }

  contenido += `
    <div style="margin-top: 10px;">
      <button onclick="cerrarSesion()" style="
        background-color: #cc0000;
        color: white;
        padding: 10px 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        font-size: 15px;
      ">Cerrar sesión</button>
    </div>
  `;

  menu.innerHTML = contenido;

  // Agregar evento click al botón de solicitudes para redirigir
  const btnSolicitudes = document.getElementById("btnSolicitudes");
  if(btnSolicitudes){
    btnSolicitudes.onclick = () => {
      window.location.href = "solicitudes_edicion_mtrs.html";
    };
  }
}

function irAltaUsuario() {
  window.location.href = "alta_usuario.html";
}

// ---------------------------
// Cerrar sesión
// ---------------------------
function cerrarSesion(){
  auth.signOut().then(()=>{
    localStorage.clear();
    window.location.href = "inicio.html";
  }).catch(e=>alert("Error al cerrar sesión: "+e.message));
}

// ---------------------------
// Cargar maestros
// ---------------------------
async function cargarMaestros() {
  try {
    const snap = await db.collection("maestros").get();
    if (snap.empty) {
      listaMaestros.innerHTML = "<p>No hay perfiles registrados aún.</p>";
      return;
    }

    // Traemos todas las solicitudes pendientes para saber qué perfiles mostrar con campana
    const solicitudesSnap = await db.collection("solicitudes_edicion")
                                    .where("estado", "==", "pendiente")
                                    .get();
    const solicitudesPendientes = solicitudesSnap.docs.map(doc => doc.data().docMaestro);

    listaMaestros.innerHTML = ""; // Limpiar antes de agregar

    for (const doc of snap.docs) {
      const sub = await db.collection("maestros")
                          .doc(doc.id)
                          .collection("fichaIdentificacion")
                          .get();

      if (sub.empty) continue;

      let datos = {};
      sub.docs.forEach(d => datos = { ...datos, ...d.data() });

      const foto = datos.fotoPerfil || PLACEHOLDER_SVG;
      const nombre = datos.nombreCompleto || "-";
      const grado = datos.grado || "-";
      const institucion = datos.institucion || datos.Institucion || "-";
      const programa = Array.isArray(datos.programa) ? datos.programa.join(", ") : datos.programa || "-";

      // Verificamos si este usuario tiene solicitudes pendientes
      const tieneSolicitud = solicitudesPendientes.includes(doc.id);

      const card = document.createElement("div");
      card.className = "perfil-card";
      card.style.position = "relative"; // necesario para ubicar la campana

      card.innerHTML = `
        <div class="contenedor-foto-card" id="foto-${doc.id}" style="position: relative;">
          <img src="${escapeHtml(foto)}" alt="Foto ${escapeHtml(nombre)}" class="foto-perfil-card">
          ${tieneSolicitud ? `<div class="icono-campana" style="position:absolute; top:5px; right:5px; font-size:24px; cursor:pointer;">🔔</div>` : ''}
        </div>
        <div class="info-maestro">
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Grado:</strong> ${escapeHtml(grado)}</p>
          <p><strong>Institución:</strong> ${escapeHtml(institucion)}</p>
          <p><strong>Programas:</strong> ${escapeHtml(programa)}</p>
          <a class="btn-mas-info" href="miperfil.html?doc=${encodeURIComponent(doc.id)}">Más información</a>
        </div>
      `;

      // Evento click en campana
      if(tieneSolicitud){
        const campana = card.querySelector(".icono-campana");
        if(campana){
          campana.onclick = () => {
            window.location.href = "solicitudes_edicion_mtrs.html";
          };
        }
      }

      listaMaestros.appendChild(card);
    }

  } catch (err) {
    console.error("Error al cargar maestros:", err);
    listaMaestros.innerHTML = "<p>Error al cargar los perfiles. Revisa la consola.</p>";
  }
}

// ---------------------------
// Notificaciones en tiempo real
// ---------------------------
db.collection("solicitudes_edicion")
  .where("estado", "==", "pendiente")
  .onSnapshot(snapshot => {
      solicitudesArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Actualizar menú si está abierto
      const menu = document.getElementById("menuHamburguesa");
      if(menu.classList.contains("menu-visible")){
          irSolicitudes();
      }

      // Actualizar campanas sobre perfiles
      actualizarCampanas();
  });

// ---------------------------
// Iconos de campana en perfiles
// ---------------------------
function actualizarCampanas() {
  solicitudesArray.forEach(sol => {
      const contFoto = document.getElementById(`foto-${sol.docMaestro}`);
      if(contFoto && !contFoto.querySelector(".icono-campana")){
          const campana = document.createElement("span");
          campana.className = "icono-campana";
          campana.innerHTML = "🔔";
          campana.style.position = "absolute";
          campana.style.top = "5px";
          campana.style.right = "5px";
          campana.style.fontSize = "24px";
          campana.style.cursor = "pointer";
          campana.onclick = () => {
            window.location.href = "solicitudes_edicion_mtrs.html";
          };
          contFoto.style.position = "relative"; // asegurar posicionamiento
          contFoto.appendChild(campana);
      }
  });
}

// ---------------------------
// Inicializar
// ---------------------------
cargarMaestros();
