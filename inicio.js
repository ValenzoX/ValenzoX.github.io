// ----------------- CONFIGURACIÓN DE FIREBASE -----------------
const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ----------------- VARIABLES GLOBALES -----------------
let todosLosMaestros = [];
let ofertaEducativa = []; // Excel

// ----------------- CARGAR EXCEL -----------------
async function cargarExcel() {
  const response = await fetch("Oferta_Educativa_UAGro_2025.xlsx");
  const data = await response.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  ofertaEducativa = XLSX.utils.sheet_to_json(hoja, { defval: "" });
}

// ----------------- RENDERIZAR MAESTROS -----------------
function renderizarMaestros(lista) {
  const contenedorMaestros = document.getElementById("listaMaestros");
  contenedorMaestros.innerHTML = "";
  if (lista.length === 0) {
    contenedorMaestros.innerText = "No se encontraron maestros.";
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("perfil-card");

    div.innerHTML = `
      <div class="contenedor-foto-card">
        <img src="${item.fotoPerfil || 'default.jpg'}" alt="Foto de ${item.nombreCompleto || 'Maestro'}" class="foto-perfil-card">
      </div>
      <div class="info-maestro">
        <p><strong>${item.nombreCompleto || "-"}</strong></p>
        <p>Grado: ${item.grado || "-"}</p>
        <p>Institución: ${item.institucion || "-"}</p>
        <p>Programa(s): ${Array.isArray(item.programa) ? item.programa.join(", ") : item.programa || "-"}</p>
        <button class="btn-ver-perfil">Ver perfil</button>
      </div>
    `;

    div.querySelector(".btn-ver-perfil").addEventListener("click", () => {
      window.location.href = `miPerfil.html?doc=${item.id}`;
    });

    contenedorMaestros.appendChild(div);
  });
}

// ----------------- APLICAR FILTROS -----------------
function aplicarFiltros() {
  const inst = document.getElementById("filtroInstitucion").value;
  const esc = document.getElementById("filtroEscuela").value;
  const prog = document.getElementById("filtroPrograma").value;

  const filtrados = todosLosMaestros.filter(m => {
    const coincideInst = !inst || m.institucion === inst;
    const coincideEsc = inst === "UAGRO" ? (!esc || m.escuela === esc) : true;
    const coincideProg = inst === "UAGRO" ? (!prog || (Array.isArray(m.programa) ? m.programa.includes(prog) : m.programa === prog)) : true;
    return coincideInst && coincideEsc && coincideProg;
  });

  renderizarMaestros(filtrados);
}

// ----------------- CONFIGURAR FILTROS -----------------
function configurarFiltros() {
  const filtroInstitucion = document.getElementById("filtroInstitucion");
  const filtroEscuela = document.getElementById("filtroEscuela");
  const filtroPrograma = document.getElementById("filtroPrograma");

  // Cambio de Institución
  filtroInstitucion.addEventListener("change", () => {
    const inst = filtroInstitucion.value;
    filtroEscuela.innerHTML = `<option value="">Seleccione institución primero</option>`;
    filtroPrograma.innerHTML = `<option value="">Seleccione escuela/facultad primero</option>`;
    filtroEscuela.disabled = true;
    filtroPrograma.disabled = true;

    if (inst === "UAGRO") {
      const escuelas = [...new Set(ofertaEducativa.map(r => r["Escuela o Facultad"]))];
      escuelas.forEach(e => {
        let opt = document.createElement("option");
        opt.value = e;
        opt.textContent = e;
        filtroEscuela.appendChild(opt);
      });
      filtroEscuela.disabled = false;
    }
    aplicarFiltros();
  });

  // Cambio de Escuela
  filtroEscuela.addEventListener("change", () => {
    const esc = filtroEscuela.value;
    filtroPrograma.innerHTML = `<option value="">Seleccione escuela/facultad primero</option>`;
    filtroPrograma.disabled = true;

    if (esc) {
      const programas = ofertaEducativa
        .filter(r => r["Escuela o Facultad"] === esc)
        .map(r => r["Programa Educativo"]);
      [...new Set(programas)].forEach(p => {
        let opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        filtroPrograma.appendChild(opt);
      });
      filtroPrograma.disabled = false;
    }
    aplicarFiltros();
  });

  filtroPrograma.addEventListener("change", aplicarFiltros);
}

// ----------------- INICIO -----------------
document.addEventListener("DOMContentLoaded", async function() {
  await cargarExcel();
  configurarFiltros();

  const contenedorMaestros = document.getElementById("listaMaestros");

  // Obtener maestros desde Firebase
  db.collection("maestros").get().then(snapshot => {
    if (snapshot.empty) {
      contenedorMaestros.innerText = "No se encontraron maestros.";
      return;
    }

    snapshot.docs.forEach(doc => {
      const correoDoc = doc.id;
      doc.ref.collection("fichaIdentificacion").get().then(sub => {
        if (sub.empty) return;

        let datos = {};
        sub.docs.forEach(d => datos = { ...datos, ...d.data() });

        // Para UAGro, asignar escuela automáticamente según Excel
        if (datos.institucion === "UAGRO" && datos.programa) {
          const programaLista = Array.isArray(datos.programa) ? datos.programa : [datos.programa];
          const programaMatch = ofertaEducativa.find(r => programaLista.includes(r["Programa Educativo"]));
          datos.escuela = programaMatch ? programaMatch["Escuela o Facultad"] : "";
        }

        const maestro = { id: correoDoc, ...datos };
        todosLosMaestros.push(maestro);

        renderizarMaestros(todosLosMaestros);
      }).catch(err => console.error("Error al obtener fichaIdentificacion:", err));
    });
  }).catch(err => console.error("Error al obtener maestros:", err));
});
