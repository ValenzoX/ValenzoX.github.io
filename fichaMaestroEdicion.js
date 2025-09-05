// ----------------- CONFIGURACIÓN DE FIREBASE -----------------
const firebaseConfigFicha = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

firebase.initializeApp(firebaseConfigFicha);
const dbFicha = firebase.firestore();

// Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcxhk1f1l/upload";
const CLOUDINARY_UPLOAD_PRESET = "ficha_maestro_preset";

// ----------------- CARGAR EXCEL -----------------
async function cargarExcel() {
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

// ----------------- POBLAR SELECTS -----------------
// ----------------- POBLAR SELECTS -----------------
async function poblarSelects() {
  const datos = await cargarExcel();
  if (!datos.length) return;
  window.datosExcel = datos;

  const escuelaSelect = document.getElementById("escuela");
  const programasContainer = document.getElementById("programasContainer");

  const escuelas = [...new Set(datos.map(d => d["Escuela o Facultad"]))];
  escuelas.forEach(esc => {
    const option = document.createElement("option");
    option.value = esc;
    option.textContent = esc;
    escuelaSelect.appendChild(option);
  });

  // Exponemos la función para poder usarla fuera
  window.crearSelectPrograma = function crearSelectPrograma(escuela = "", valorInicial = "") {
    const programas = escuela
      ? [...new Set(datos.filter(d => d["Escuela o Facultad"] === escuela).map(d => d["Programa Educativo"]))]
      : [];
    const div = document.createElement("div");
    div.className = "programaDiv";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "5px";

    const select = document.createElement("select");
    select.innerHTML = `<option value="">Seleccione un programa</option>`;
    programas.forEach(p => select.appendChild(Object.assign(document.createElement("option"), { value: p, textContent: p })));
    if (valorInicial) select.value = valorInicial;

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.textContent = "❌";
    btnEliminar.style.marginLeft = "5px";
    btnEliminar.addEventListener("click", () => div.remove());

    div.appendChild(select);
    div.appendChild(btnEliminar);

    if (programas.length > 1) {
      const btnAgregar = document.createElement("button");
      btnAgregar.type = "button";
      btnAgregar.textContent = "➕";
      btnAgregar.style.marginLeft = "5px";
      btnAgregar.addEventListener("click", () => {
        if (!select.value) return alert("Seleccione un programa antes de agregar otro.");
        btnAgregar.disabled = true;
        crearSelectPrograma(escuela);
      });
      div.appendChild(btnAgregar);
    }
    programasContainer.appendChild(div);
  };

  escuelaSelect.addEventListener("change", () => {
    programasContainer.innerHTML = "";
    if (escuelaSelect.value) window.crearSelectPrograma(escuelaSelect.value, true);
  });

  window.crearSelectPrograma();
}


// ----------------- TABS -----------------
function abrirTab(evt, tabName) {
  Array.from(document.getElementsByClassName("tabcontent")).forEach(tc => tc.style.display = "none");
  Array.from(document.getElementsByClassName("tablink")).forEach(tl => tl.classList.remove("active"));
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------- CAMPOS CONDICIONALES -----------------
function mostrarContactoExtranjero(valor) { document.getElementById("contactoExtranjero").style.display = valor === "si" ? "block" : "none"; }
function mostrarActividad(valor) { document.getElementById("descripcionActividad").style.display = valor === "si" ? "block" : "none"; }

function cambiarInstitucion(valor) {
  const campoOtra = document.getElementById("institucionOtra");
  const escuelaSelect = document.getElementById("escuela");
  const programasContainer = document.getElementById("programasContainer");
  const escuelaInput = document.getElementById("escuelaInput");
  const programaInput = document.getElementById("programaInput");

  if (valor === "Otra") {
    campoOtra.style.display = "block";
    escuelaSelect.style.display = "none";
    programasContainer.innerHTML = "";
    escuelaInput.style.display = "block";
    programaInput.style.display = "block";
  } else if (valor === "UAGRO") {
    campoOtra.style.display = "none";
    escuelaInput.style.display = "none";
    programaInput.style.display = "none";
    escuelaSelect.style.display = "block";
    programasContainer.innerHTML = "";
    if (window.datosExcel && window.datosExcel.length > 0) crearSelectPrograma();
  }
}
document.getElementById("institucion").addEventListener("change", function () { cambiarInstitucion(this.value); });

// ----------------- ASIGNATURAS DINÁMICAS -----------------
let contadorAsignaturas = 1;
function agregarAsignaturaColaboracion() {
  contadorAsignaturas++;
  const contenedor = document.getElementById("asignaturasColaboracion");
  const div = document.createElement("div");
  div.className = "asignaturaGrupo";
  div.style.marginBottom = "5px";
  div.innerHTML = `
      <strong>Asignatura ${contadorAsignaturas}</strong><br>
      <input type="text" class="nombreAsignatura" placeholder="Nombre de la asignatura">
      <input type="text" class="descripcionAsignatura" placeholder="Descripción de asignatura">
      <input type="text" class="periodoAsignatura" placeholder="Periodo (Ago 2025 - Ene 2026)">
      <select class="modalidadAsignatura">
        <option value="">Seleccione modalidad</option>
        <option value="Escolarizada">Escolarizada</option>
        <option value="Virtual">Virtual</option>
        <option value="Mixta">Mixta</option>
      </select>
      <button type="button" onclick="this.parentElement.remove(); numerarAsignaturas()">❌</button>`;
  contenedor.appendChild(div);
}

function numerarAsignaturas() {
  const grupos = document.querySelectorAll("#asignaturasColaboracion .asignaturaGrupo");
  grupos.forEach((g, i) => g.querySelector("strong").textContent = `Asignatura ${i + 1}`);
  contadorAsignaturas = grupos.length;
}

function inicializarAsignaturasColaboracion() {
  const contenedor = document.getElementById("asignaturasColaboracion");
  contenedor.innerHTML = "";
  agregarAsignaturaColaboracion();
}

// ----------------- CARGAR DATOS EXISTENTES -----------------
async function cargarDatosMaestro() {
  const correo = localStorage.getItem("correoMaestro");
  if (!correo) return;

  const docId = correo.replace(/[.#$[\]@]/g, "_");
  const docRef = dbFicha.collection("maestros").doc(docId).collection("fichaIdentificacion");

  const dpSnap = await docRef.doc("datosPersonales").get();
  const dlSnap = await docRef.doc("datosLaborales").get();
  const icSnap = await docRef.doc("informacionColaboracion").get();

  if (dpSnap.exists) {
    const dp = dpSnap.data();
    document.getElementById("nombreCompleto").value = dp.nombreCompleto || "";
    document.getElementById("edad").value = dp.edad || "";
    document.getElementById("sexo").value = dp.sexo || "";
    document.getElementById("grado").value = dp.grado || "";
    document.getElementById("contactoCorreo").value = dp.contactoCorreo || "";
    document.getElementById("contactoTelefono").value = dp.contactoTelefono || "";
    document.getElementById("contactoRedes").value = dp.contactoRedes || "";
  }

  if (dlSnap.exists) {
    const dl = dlSnap.data();
    document.getElementById("institucion").value = dl.institucion === "UAGRO" ? "UAGRO" : "Otra";
    cambiarInstitucion(document.getElementById("institucion").value);
    if (dl.institucion === "UAGRO") document.getElementById("escuela").value = dl.escuelaAdscripcion || "";
    else document.getElementById("escuelaInput").value = dl.escuelaAdscripcion || "";
    if (dl.programa?.length > 0) {
      const container = document.getElementById("programasContainer");
      container.innerHTML = "";
      dl.programa.forEach(p => crearSelectPrograma(dl.escuelaAdscripcion || "", p));
    }
    document.getElementById("formacionAcademica").value = dl.formacionAcademica || "";
  }

  if (icSnap.exists) {
    const ic = icSnap.data();
    inicializarAsignaturasColaboracion();
    const grupos = document.querySelectorAll("#asignaturasColaboracion .asignaturaGrupo");
    ic.asignaturasUAP?.forEach((asig, i) => {
      if (grupos[i]) {
        grupos[i].querySelector(".nombreAsignatura").value = asig.nombre || "";
        grupos[i].querySelector(".descripcionAsignatura").value = asig.descripcion || "";
        grupos[i].querySelector(".periodoAsignatura").value = asig.periodo || "";
        grupos[i].querySelector(".modalidadAsignatura").value = asig.modalidad || "";
      } else agregarAsignaturaColaboracion();
    });

    document.getElementById("colaboraExtranjero").value = ic.colaboraExtranjero || "no";
    mostrarContactoExtranjero(ic.colaboraExtranjero || "no");
    document.getElementById("nombreContactoExtranjero").value = ic.nombreContactoExtranjero || "";
    document.getElementById("correoContactoExtranjero").value = ic.correoContactoExtranjero || "";

    document.getElementById("actividadInternacional").value = ic.actividadInternacional || "no";
    mostrarActividad(ic.actividadInternacional || "no");
    document.getElementById("detalleActividad").value = ic.detalleActividad || "";
  }
}



// ----------------- GUARDAR SECCIÓN -----------------
async function guardarSeccion(seccion) {
  const correo = localStorage.getItem("correoMaestro");
  if (!correo) {
    alert("No se encontró el correo del maestro en localStorage");
    return;
  }

  const docId = correo.replace(/[.#$[\]@]/g, "_");
  const docRef = dbFicha.collection("maestros").doc(docId).collection("fichaIdentificacion");

  let datos = {};

  if (seccion === "datosPersonales") {
    datos = {
      nombreCompleto: document.getElementById("nombreCompleto").value,
      edad: document.getElementById("edad").value,
      sexo: document.getElementById("sexo").value,
      grado: document.getElementById("grado").value,
      contactoCorreo: document.getElementById("contactoCorreo").value,
      contactoTelefono: document.getElementById("contactoTelefono").value,
      contactoRedes: document.getElementById("contactoRedes").value,
    };
    await docRef.doc("datosPersonales").set(datos, { merge: true });
  }

  if (seccion === "datosLaborales") {
    const institucion = document.getElementById("institucion").value;
    const escuelaAdscripcion =
      institucion === "UAGRO"
        ? document.getElementById("escuela").value
        : document.getElementById("escuelaInput").value;

    const programas = [];
    document.querySelectorAll("#programasContainer select").forEach(s => {
      if (s.value) programas.push(s.value);
    });

    datos = {
      institucion,
      escuelaAdscripcion,
      programa: programas,
      formacionAcademica: document.getElementById("formacionAcademica").value,
    };
    await docRef.doc("datosLaborales").set(datos, { merge: true });
  }

  if (seccion === "infoColaboracion") {
    const asignaturas = [];
    document.querySelectorAll("#asignaturasColaboracion .asignaturaGrupo").forEach(g => {
      asignaturas.push({
        nombre: g.querySelector(".nombreAsignatura").value,
        descripcion: g.querySelector(".descripcionAsignatura").value,
        periodo: g.querySelector(".periodoAsignatura").value,
        modalidad: g.querySelector(".modalidadAsignatura").value,
      });
    });

    datos = {
      asignaturasUAP: asignaturas,
      colaboraExtranjero: document.getElementById("colaboraExtranjero").value,
      nombreContactoExtranjero: document.getElementById("nombreContactoExtranjero").value,
      correoContactoExtranjero: document.getElementById("correoContactoExtranjero").value,
      actividadInternacional: document.getElementById("actividadInternacional").value,
      detalleActividad: document.getElementById("detalleActividad").value,
    };
    await docRef.doc("informacionColaboracion").set(datos, { merge: true });
  }

  document.getElementById("mensaje").textContent = `✅ ${seccion} guardada correctamente`;
}






// ----------------- BOTÓN "VER PERFIL" -----------------
function agregarBotonVerPerfil() {
  const contenedor = document.getElementById("fichaContainer");
  if (!contenedor) return;

  // Eliminar botón anterior si existe
  const btnExistente = document.getElementById("btnVerPerfil");
  if (btnExistente) btnExistente.remove();

  const btn = document.createElement("button");
  btn.id = "btnVerPerfil"; // darle un id para controlarlo
  btn.textContent = "Ver perfil";
  btn.style.marginTop = "15px";
  btn.style.padding = "8px 15px";
  btn.style.backgroundColor = "#4CAF50";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "5px";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "16px";

  btn.addEventListener("click", () => {
    const correo = localStorage.getItem("correoMaestro");
    if (!correo) return alert("No se encontró el correo del maestro");
    window.location.href = `miPerfil.html?correo=${encodeURIComponent(correo)}`;
  });

  contenedor.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", () => {
  poblarSelects().then(() => cargarDatosMaestro());
  inicializarAsignaturasColaboracion();
  agregarBotonVerPerfil(); // ahora solo se agregará un botón
});



// ----------------- INICIAR -----------------
document.addEventListener("DOMContentLoaded", () => {
  poblarSelects().then(() => cargarDatosMaestro());
  inicializarAsignaturasColaboracion();
  agregarBotonVerPerfil(); // <-- Agregamos el botón
});

