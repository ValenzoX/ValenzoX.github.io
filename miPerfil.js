// ----------------- CONFIGURACIÓN DE FIREBASE -----------------
const firebaseConfigFicha = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfigFicha);
}

// Firestore
const dbFicha = firebase.firestore();

// Authentication
const auth = firebase.auth();

// Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcxhk1f1l/upload";
const CLOUDINARY_UPLOAD_PRESET = "ficha_maestro_preset";

// ----------------- CONTENEDOR PRINCIPAL -----------------
const perfilContainer = document.getElementById("perfilContent");

// ================= MENÚ HAMBURGUESA =================
function mostrarMenu() {
  const menu = document.getElementById("menuHamburguesa");
  menu.classList.toggle("menu-visible");
  if (!menu.classList.contains("menu-visible")) return;

  const correo = localStorage.getItem("correoMaestro");
  let password = localStorage.getItem("passwordMaestro");
  let contenido = `<p><strong>Correo:</strong> ${correo}</p>`;

  if (password) {
    contenido += `
    <div class="campo-password">
      <label for="passInput"><strong>Contraseña:</strong></label>
      <input type="password" id="passInput" value="${password}" disabled>
      <div class="botones-pass">
        <button onclick="togglePassword()">👁️</button>
        <button onclick="activarEdicion()">Editar contraseña</button>
      </div>
      <div id="editarSeccion" style="display:none; margin-top: 10px;">
        <input type="password" id="nuevaPass" placeholder="Nueva contraseña">
        <button onclick="guardarNuevaPass()">Guardar nueva contraseña</button>
      </div>
    </div>`;
  }

  contenido += `
  <div style="margin-top: 20px;">
    <button onclick="cerrarSesion()" style="background-color: #cc0000; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
      Cerrar sesión
    </button>
  </div>`;

  menu.innerHTML = contenido;
}

function togglePassword() {
  const input = document.getElementById("passInput");
  input.type = input.type === "password" ? "text" : "password";
}

function activarEdicion() {
  document.getElementById("editarSeccion").style.display = "block";
}

function guardarNuevaPass() {
  const nuevaPass = document.getElementById("nuevaPass").value.trim();
  if (nuevaPass.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }
  const user = auth.currentUser;
  if (user) {
    user.updatePassword(nuevaPass)
      .then(() => {
        localStorage.setItem("passwordMaestro", nuevaPass);
        alert("¡Contraseña actualizada correctamente!");
        mostrarMenu();
      })
      .catch(err => {
        console.error(err);
        alert("Error al actualizar la contraseña. Debes haber iniciado sesión recientemente.");
      });
  } else {
    alert("No se detectó sesión activa. Por favor inicia sesión nuevamente.");
  }
}

// ================= MOSTRAR PERFIL =================
// ================= MOSTRAR PERFIL =================
function mostrarPerfil(data, perfilCorreo, esMismoUsuario = false) {
  let html = "";

  // Foto y nombre
  html += `<div class="contenedor-imagen"><img src="${data.fotoPerfil || 'logo.jpg'}" class="foto-perfil"></div>`;
  html += `<div class="nombre-perfil">${data.nombreCompleto || '-'}</div>`;

  // Datos personales, laborales, colaboración...
  html += `<div class="perfil-section"><h3>Datos Personales</h3> ... </div>`;

  // Mostrar botón de editar solo si es el mismo usuario
  if (esMismoUsuario) {
    html += `<div style="text-align:center; margin-top:20px;">
      <button id="btnEditarPerfil" onclick="window.location.href='fichaMaestroEdicion.html?doc=${encodeURIComponent(perfilCorreo)}'">✏️ Editar</button>
    </div>`;
  }

  perfilContainer.innerHTML = html;
}



// ================= CARGAR EXCEL =================
async function cargarExcelUAGRO() {
  try {
    const response = await fetch("Oferta_Educativa_UAGro_2025.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja);
  } catch (error) {
    console.error("Error cargando Excel:", error);
    return [];
  }
}

// ================= ACTIVAR EDICIÓN =================
async function activarEdicionPerfil() {
  const correoUsuario = localStorage.getItem("correoMaestro");
  if (!correoUsuario) return alert("No se encontró el correo del usuario.");

  const docId = correoUsuario.replace(/[.#$[\]@]/g, "_");
  const docRef = dbFicha.collection("maestros").doc(docId);

  // Obtener datos de Firestore
  const datosPersonalesSnap = await docRef.collection("fichaIdentificacion").doc("datosPersonales").get();
  const datosLaboralesSnap = await docRef.collection("fichaIdentificacion").doc("datosLaborales").get();
  const infoColaboracionSnap = await docRef.collection("fichaIdentificacion").doc("informacionColaboracion").get();

  const datosPersonales = datosPersonalesSnap.exists ? datosPersonalesSnap.data() : {};
  const datosLaborales = datosLaboralesSnap.exists ? datosLaboralesSnap.data() : {};
  const infoColaboracion = infoColaboracionSnap.exists ? infoColaboracionSnap.data() : {};

  // --- DATOS PERSONALES ---
  document.getElementById("nombreCompleto").value = datosPersonales.nombreCompleto || "";
  document.getElementById("grado").value = datosPersonales.grado || "";
  document.getElementById("sexo").value = datosPersonales.sexo || "";
  document.getElementById("contactoCorreo").value = datosPersonales.contactoCorreo || "";
  document.getElementById("contactoTelefono").value = datosPersonales.contactoTelefono || "";
  document.getElementById("contactoRedes").value = datosPersonales.contactoRedes || "";

  // --- DATOS LABORALES ---
  document.getElementById("institucion").value = datosLaborales.institucion || "UAGRO";
  cambiarInstitucion(datosLaborales.institucion || "UAGRO");

  // Esperar a que los selects de Excel estén cargados
  await poblarSelects();

  if (datosLaborales.escuelaAdscripcion) {
    document.getElementById("escuela").value = datosLaborales.escuelaAdscripcion;
    const programasContainer = document.getElementById("programasContainer");
    programasContainer.innerHTML = "";
    datosLaborales.programa?.forEach(prog => crearSelectPrograma(datosLaborales.escuelaAdscripcion, prog));
  }

  document.getElementById("formacionAcademica").value = datosLaborales.formacionAcademica || "";

  // --- COLABORACIÓN INTERNACIONAL ---
  document.getElementById("colaboraExtranjero").value = infoColaboracion.colaboraExtranjero || "no";
  mostrarContactoExtranjero(infoColaboracion.colaboraExtranjero || "no");
  mostrarActividad(infoColaboracion.actividadInternacional || "no");

  document.getElementById("nombreContactoExtranjero").value = infoColaboracion.nombreContactoExtranjero || "";
  document.getElementById("correoContactoExtranjero").value = infoColaboracion.correoContactoExtranjero || "";
  document.getElementById("detalleActividad").value = infoColaboracion.detalleActividad || "";

  // --- ASIGNATURAS ---
  const contenedor = document.getElementById("asignaturasColaboracion");
  contenedor.innerHTML = "";
  const asignaturas = infoColaboracion.asignaturasUAP || [];
  if (asignaturas.length === 0) {
    inicializarAsignaturasColaboracion();
  } else {
    asignaturas.forEach((asig, i) => {
      const div = document.createElement("div");
      div.className = "asignaturaGrupo";
      div.style.marginBottom = "5px";
      div.innerHTML = `
        <strong>Asignatura ${i+1}</strong><br>
        <input type="text" class="nombreAsignatura" placeholder="Nombre de la asignatura" value="${asig.nombre || ""}">
        <input type="text" class="descripcionAsignatura" placeholder="Descripción de asignatura" value="${asig.descripcion || ""}">
        <input type="text" class="periodoAsignatura" placeholder="Periodo" value="${asig.periodo || ""}">
        <select class="modalidadAsignatura">
          <option value="">Seleccione modalidad</option>
          <option value="Escolarizada" ${asig.modalidad==="Escolarizada"?"selected":""}>Escolarizada</option>
          <option value="Virtual" ${asig.modalidad==="Virtual"?"selected":""}>Virtual</option>
          <option value="Mixta" ${asig.modalidad==="Mixta"?"selected":""}>Mixta</option>
        </select>
        <button type="button" onclick="this.parentElement.remove(); numerarAsignaturas()">❌</button>
      `;
      contenedor.appendChild(div);
    });
    contadorAsignaturas = asignaturas.length;
  }

  // Cambiar botón de editar por guardar
  // Cambiar botón de editar por guardar
const btnEditar = document.getElementById("btnEditarPerfil");
if (btnEditar) {
  btnEditar.textContent = "💾 Guardar cambios";
  btnEditar.onclick = guardarEdicionPerfil; // ✅ ahora solo una función central
}

}

// ================= OCULTAR/MOSTRAR CAMPOS EXTRANJERO =================
function toggleColaboraExtranjero() {
  const valor = document.getElementById("colaboraExtranjero")?.value;
  const nombres = ["nombreContactoExtranjero", "correoContactoExtranjero", "detalleActividad"];
  nombres.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.parentElement.style.display = (valor==="si") ? "block" : "none";
  });
}

// ================= GUARDAR CAMBIOS EN FIRESTORE =================
// ================= GUARDAR CAMBIOS EN FIRESTORE =================
// ================= GUARDAR CAMBIOS EN FIRESTORE =================
async function guardarEdicionPerfil() {
  const user = auth.currentUser;
  if (!user) { 
    alert("No hay sesión activa."); 
    return; 
  }

  const docId = user.email.replace(/[.#$[\]@]/g, "_");
  const docRef = dbFicha.collection("maestros").doc(docId).collection("fichaIdentificacion");

  // --- DATOS PERSONALES ---
  const datosPersonales = {
    nombreCompleto: document.getElementById("nombreCompleto")?.value || "",
    grado: document.getElementById("grado")?.value || "",
    edad: document.getElementById("edad")?.value || "",   // ✅ añadí edad
    sexo: document.getElementById("sexo")?.value || "",
    contactoCorreo: document.getElementById("contactoCorreo")?.value || "",
    contactoTelefono: document.getElementById("contactoTelefono")?.value || "",
    contactoRedes: document.getElementById("contactoRedes")?.value || ""
  };

  // --- DATOS LABORALES ---
  const datosLaborales = {
    institucion: document.getElementById("institucion")?.value || "",
    escuelaAdscripcion: document.getElementById("escuela")?.value || "",
    programa: Array.from(document.querySelectorAll("#programasContainer select"))
                  .map(sel => sel.value)
                  .filter(v => v !== ""), // ✅ mejor manejo de programas
    formacionAcademica: document.getElementById("formacionAcademica")?.value || ""
  };

  // --- COLABORACIÓN INTERNACIONAL ---
  const infoColaboracion = {
    colaboraExtranjero: document.getElementById("colaboraExtranjero")?.value || "no",
    nombreContactoExtranjero: document.getElementById("nombreContactoExtranjero")?.value || "",
    correoContactoExtranjero: document.getElementById("correoContactoExtranjero")?.value || "",
    detalleActividad: document.getElementById("detalleActividad")?.value || ""
  };

  // --- ASIGNATURAS ---
  const asignaturas = [];
  document.querySelectorAll(".asignaturaGrupo").forEach(grupo => {
    asignaturas.push({
      nombre: grupo.querySelector(".nombreAsignatura")?.value || "",
      descripcion: grupo.querySelector(".descripcionAsignatura")?.value || "",
      periodo: grupo.querySelector(".periodoAsignatura")?.value || "",
      modalidad: grupo.querySelector(".modalidadAsignatura")?.value || ""
    });
  });
  infoColaboracion.asignaturasUAP = asignaturas;

  try {
    // Guardar todo en Firestore usando batch
    const batch = dbFicha.batch();

    const docDatosPersonales = docRef.doc("datosPersonales");
    const docDatosLaborales = docRef.doc("datosLaborales");
    const docInfoColaboracion = docRef.doc("informacionColaboracion");

    batch.set(docDatosPersonales, datosPersonales, { merge: true });
    batch.set(docDatosLaborales, datosLaborales, { merge: true });
    batch.set(docInfoColaboracion, infoColaboracion, { merge: true });

    await batch.commit();

    mostrarToast("¡Perfil actualizado correctamente!");
    cargarPerfil(); // recarga el perfil actualizado

  } catch (err) {
    console.error(err);
    alert("Error al actualizar el perfil. Intenta nuevamente.");
  }
}


// ================= TOAST =================
function mostrarToast(mensaje) {
  let toast = document.createElement("div");
  toast.innerText = mensaje;
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#003366";
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.zIndex = "2000";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ================= CERRAR SESIÓN =================
function cerrarSesion() {
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.href = "index.html";
  }).catch(err => console.error(err));
}

// ================= CARGAR PERFIL =================
function getDocFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("doc");
}

async function cargarPerfil() {
  const docParam = getDocFromURL(); // URL ?doc=correo
  let correoUsuarioLogueado = null;

  await new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      if (user) correoUsuarioLogueado = user.email.replace(/[.#$[\]@]/g, "_");
      resolve();
    });
  });

  const docId = docParam || correoUsuarioLogueado;
  if (!docId) {
    perfilContainer.innerHTML = "<p>No se encontró el perfil. Inicia sesión o vuelve a inicio.</p>";
    return;
  }

  try {
    const docRef = dbFicha.collection("maestros").doc(docId);
    const snapshot = await docRef.collection("fichaIdentificacion").get();

    if (snapshot.empty) {
      perfilContainer.innerHTML = "<p>No se encontró ninguna ficha para este maestro.</p>";
      return;
    }

    // Combinar todos los documentos de ficha
    let datosPerfil = {};
    snapshot.docs.forEach(doc => datosPerfil = { ...datosPerfil, ...doc.data() });

    // Mostrar perfil
    const esMismoUsuario = correoUsuarioLogueado && (correoUsuarioLogueado === docId);
    mostrarPerfil(datosPerfil, docId, esMismoUsuario);

  } catch (err) {
    perfilContainer.innerHTML = "<p>Error al obtener la ficha.</p>";
    console.error(err);
  }
}


// Ejecutar al cargar
cargarPerfil();

