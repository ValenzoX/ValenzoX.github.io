// ----------------- CONFIGURACIÓN DE FIREBASE -----------------
const firebaseConfigFicha = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

firebase.initializeApp(firebaseConfigFicha);
const dbFicha = firebase.firestore();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcxhk1f1l/upload";
const CLOUDINARY_UPLOAD_PRESET = "ficha_maestro_preset";

// ----------------- CARGAR EXCEL -----------------
async function cargarExcel() {
  try {
    const response = await fetch("Oferta_Educativa_UAGro_2025.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(hoja);
    return json;
  } catch (error) {
    console.error("Error cargando Excel:", error);
    return [];
  }
}

// ----------------- POBLAR SELECTS  -----------------
async function poblarSelects() {
  const datos = await cargarExcel();
  if (datos.length === 0) return;

  // Guardamos en variable global para usar en crearSelectPrograma
  window.datosExcel = datos;

  const escuelaSelect = document.getElementById("escuela");
  const programasContainer = document.getElementById("programasContainer");

  // Poblar escuelas
  const escuelas = [...new Set(datos.map(d => d["Escuela o Facultad"]))];
  escuelas.forEach(esc => {
    const option = document.createElement("option");
    option.value = esc;
    option.textContent = esc;
    escuelaSelect.appendChild(option);
  });

  // Función para crear un nuevo select de programas
  function crearSelectPrograma(escuela = "", valorInicial = "") {
    const datos = window.datosExcel;
    const programas = escuela
      ? [...new Set(datos
          .filter(d => d["Escuela o Facultad"] === escuela)
          .map(d => d["Programa Educativo"]))]
      : []; // si no hay escuela, programs vacío para select inicial

    const div = document.createElement("div");
    div.className = "programaDiv";
    div.style.display = "flex";           // Alinear select y botones en la misma fila
    div.style.alignItems = "center";
    div.style.marginBottom = "5px";

    // Crear select
    const select = document.createElement("select");
    select.innerHTML = `<option value="">Seleccione un programa</option>`;
    programas.forEach(prog => {
      const option = document.createElement("option");
      option.value = prog;
      option.textContent = prog;
      select.appendChild(option);
    });
    if (valorInicial) select.value = valorInicial;

    // Botón eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.textContent = "❌";
    btnEliminar.style.marginLeft = "5px";
    btnEliminar.addEventListener("click", () => div.remove());

    div.appendChild(select);
    div.appendChild(btnEliminar);

    // Botón agregar solo si hay más de 1 programa disponible
    if (programas.length > 1) {
      const btnAgregar = document.createElement("button");
      btnAgregar.type = "button";
      btnAgregar.textContent = "➕";
      btnAgregar.style.marginLeft = "5px";
      btnAgregar.addEventListener("click", () => {
        if (select.value === "") return alert("Seleccione un programa antes de agregar otro.");
        btnAgregar.disabled = true;
        crearSelectPrograma(escuela); // agregar otro select debajo
      });
      div.appendChild(btnAgregar);
    }

    // Agregar div al contenedor
    programasContainer.appendChild(div);
  }

  // Evento al cambiar escuela
  escuelaSelect.addEventListener("change", () => {
    programasContainer.innerHTML = "";
    if (escuelaSelect.value) {
      crearSelectPrograma(escuelaSelect.value, true); // primer select con programas
    }
  });

  // Crear primer select vacío por defecto al cargar la página
  crearSelectPrograma();
}




// ----------------- FUNCIONES DE TABS -----------------
function abrirTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
  const tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) tablinks[i].classList.remove("active");

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------- CAMPOS CONDICIONALES -----------------
function mostrarContactoExtranjero(valor) {
  document.getElementById("contactoExtranjero").style.display = valor === "si" ? "block" : "none";
}
function mostrarActividad(valor) {
  document.getElementById("descripcionActividad").style.display = valor === "si" ? "block" : "none";
}

function cambiarInstitucion(valor) {
  const campoOtra = document.getElementById("institucionOtra");   // input nombre de otra institucion
  const escuelaSelect = document.getElementById("escuela");        // select escuela
  const programasContainer = document.getElementById("programasContainer"); // contenedor de selects de programas
  const escuelaInput = document.getElementById("escuelaInput");    // input manual escuela
  const programaInput = document.getElementById("programaInput");  // input manual programa

  if (valor === "Otra") {
    // Mostrar inputs manuales
    campoOtra.style.display = "block";
    escuelaSelect.style.display = "none";
    programasContainer.innerHTML = "";   // limpiar selects existentes
    escuelaInput.style.display = "block";
    programaInput.style.display = "block";
  } else if (valor === "UAGRO") {
    // Mostrar selects poblados por Excel
    campoOtra.style.display = "none";
    escuelaInput.style.display = "none";
    programaInput.style.display = "none";
    escuelaSelect.style.display = "block";
    programasContainer.innerHTML = "";  // limpiar por si había algo

    // Crear primer select de programas para UAGRO
    if (window.datosExcel && window.datosExcel.length > 0) {
      crearSelectPrograma();  // la función que ya tienes para poblar según Excel
    }
  }
}

// Agregar evento al select de institución
document.getElementById("institucion").addEventListener("change", function() {
  cambiarInstitucion(this.value);
});



// ----------------- FUNCIONES DE ASIGNATURAS DINÁMICAS -----------------
// ----------------- FUNCIONES DE UAP DINÁMICAS -----------------
let contadorAsignaturas = 1;

function agregarAsignaturaColaboracion() {
  contadorAsignaturas++;
  const contenedor = document.getElementById("asignaturasColaboracion");
  const div = document.createElement("div");
  div.className = "asignaturaGrupo";
  div.style.marginBottom = "5px";
  div.innerHTML = `
      <strong>UAP ${contadorAsignaturas}</strong><br>
      <input type="text" class="nombreAsignatura" placeholder="Nombre de la UAP">
      <input type="text" class="descripcionAsignatura" placeholder="Descripción de la UAP">
      <input type="text" class="periodoAsignatura" placeholder="Periodo (Ago 2025 - Ene 2026)">
      <select class="modalidadAsignatura">
        <option value="">Seleccione modalidad</option>
        <option value="Escolarizada">Escolarizada</option>
        <option value="Virtual">Virtual</option>
        <option value="Mixta">Mixta</option>
      </select>
      <button type="button" onclick="this.parentElement.remove(); numerarAsignaturas()">❌</button>
    `;
  contenedor.appendChild(div);
}

// Renumerar UAP si se elimina alguna
function numerarAsignaturas() {
  const grupos = document.querySelectorAll("#asignaturasColaboracion .asignaturaGrupo");
  contadorAsignaturas = 0;
  grupos.forEach((g, i) => {
    contadorAsignaturas++;
    const strong = g.querySelector("strong");
    if (strong) strong.textContent = `UAP ${i + 1}`;
  });
}

// Inicializar primer conjunto de UAP al cargar la página
function inicializarAsignaturasColaboracion() {
  const contenedor = document.getElementById("asignaturasColaboracion");
  const div = document.createElement("div");
  div.className = "asignaturaGrupo";
  div.style.marginBottom = "5px";
  div.innerHTML = `
      <strong>UAP 1</strong><br>
      <input type="text" class="nombreAsignatura" placeholder="Nombre de la UAP">
      <input type="text" class="descripcionAsignatura" placeholder="Descripción de la UAP">
      <input type="text" class="periodoAsignatura" placeholder="Periodo (Ago 2025 - Ene 2026)">
      <select class="modalidadAsignatura">
        <option value="">Seleccione modalidad</option>
        <option value="Escolarizada">Escolarizada</option>
        <option value="Virtual">Virtual</option>
        <option value="Mixta">Mixta</option>
      </select>
    `;
  contenedor.appendChild(div);
  contadorAsignaturas = 1;
}


// ----------------- FUNCIONES DE GUARDADO POR SECCIÓN -----------------
async function guardarSeccion(seccion) {
  const mensaje = document.getElementById("mensaje");
  const correoUsuario = localStorage.getItem("correoMaestro");
  if (!correoUsuario) {
    if (mensaje) { mensaje.textContent = "Error: no se encontró el correo del usuario."; mensaje.style.color = "red"; }
    return;
  }

  const docId = correoUsuario.replace(/[.#$[\]@]/g, "_");
  const docRef = dbFicha.collection("maestros").doc(docId);

  let datos = {};

  switch (seccion) {
   case "datosPersonales":
  datos = {
    nombreCompleto: document.getElementById("nombreCompleto")?.value.trim() || "",
    edad: document.getElementById("edad")?.value || "",          // <-- AGREGAR ESTO
    grado: document.getElementById("grado")?.value.trim() || "",
    sexo: document.getElementById("sexo")?.value || "",
    contactoCorreo: document.getElementById("contactoCorreo")?.value.trim() || "",
    contactoTelefono: document.getElementById("contactoTelefono")?.value.trim() || "",
    contactoRedes: document.getElementById("contactoRedes")?.value.trim() || ""
  };
  const fotoFile = document.getElementById("fotoPerfil")?.files[0];
  if (fotoFile) {
    const formData = new FormData();
    formData.append("file", fotoFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      datos.fotoPerfil = data.secure_url;
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      if (mensaje) { mensaje.textContent = "Error al subir la foto."; mensaje.style.color = "red"; }
      return;
    }
  }
  await docRef.set({ correo: correoUsuario }, { merge: true });
  await docRef.collection("fichaIdentificacion").doc("datosPersonales").set(datos, { merge: true });
  if (mensaje) { mensaje.textContent = "Datos personales guardados ✅"; mensaje.style.color = "green"; }
  abrirTab({ currentTarget: document.querySelector(".tablink:nth-child(2)") }, "datosLaborales");
  break;



    case "datosLaborales":
      const institucionSeleccionada = document.getElementById("institucion")?.value;
      const institucionOtra = document.getElementById("institucionOtra")?.value.trim() || "";

      let escuela = "";
      let programa = [];

      if (institucionSeleccionada === "Otra") {
        // Si es "Otra", tomamos los inputs de texto
        escuela = document.getElementById("escuelaInput")?.value.trim() || "";
        programa = [document.getElementById("programaInput")?.value.trim()].filter(p => p !== "");
      } else {
        // Si es "UAGRO", usamos los selects poblados del Excel
        escuela = document.getElementById("escuela")?.value || "";
        const programasContainer = document.getElementById("programasContainer");
        programa = Array.from(programasContainer.querySelectorAll("select")).map(sel => sel.value).filter(v => v !== "");
      }

      datos = {
        institucion: institucionSeleccionada === "Otra" ? institucionOtra : institucionSeleccionada || "",
        escuelaAdscripcion: escuela,
        programa: programa,
        formacionAcademica: document.getElementById("formacionAcademica")?.value.trim() || ""
      };

      await docRef.collection("fichaIdentificacion").doc("datosLaborales").set(datos, { merge: true });
      if (mensaje) { mensaje.textContent = "Datos laborales guardados ✅"; mensaje.style.color = "green"; }
      abrirTab({ currentTarget: document.querySelector(".tablink:nth-child(3)") }, "infoColaboracion");
      break;


    case "infoColaboracion":
      const asignaturas = Array.from(document.querySelectorAll("#asignaturasColaboracion .asignaturaGrupo")).map(g => ({
        nombre: g.querySelector(".nombreAsignatura")?.value.trim() || "",
        descripcion: g.querySelector(".descripcionAsignatura")?.value.trim() || "",
        periodo: g.querySelector(".periodoAsignatura")?.value.trim() || "",
        modalidad: g.querySelector(".modalidadAsignatura")?.value || ""
      }));

      datos = {
        asignaturasUAP: asignaturas,
        colaboraExtranjero: document.getElementById("colaboraExtranjero")?.value || "no",
        nombreContactoExtranjero: document.getElementById("nombreContactoExtranjero")?.value || "",
        correoContactoExtranjero: document.getElementById("correoContactoExtranjero")?.value || "",
        actividadInternacional: document.getElementById("actividadInternacional")?.value || "no",
        detalleActividad: document.getElementById("detalleActividad")?.value || ""
      };
      await docRef.collection("fichaIdentificacion").doc("informacionColaboracion").set(datos, { merge: true });
      if (mensaje) { mensaje.textContent = "Registro completado ✅ Redirigiendo a tu perfil..."; mensaje.style.color = "green"; }
      setTimeout(() => { window.location.href = "miperfil.html"; }, 1500);
      break;

    default:
      if (mensaje) { mensaje.textContent = "Sección desconocida."; mensaje.style.color = "red"; }
  }
}

// ----------------- INICIAR -----------------
document.addEventListener("DOMContentLoaded", () => {
  poblarSelects();
  inicializarAsignaturasColaboracion();
});
