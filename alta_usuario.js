// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const correoAdmin = localStorage.getItem("correoMaestro") || "";

// ---------- Menú hamburguesa ----------
function mostrarMenu() {
  const menu = document.getElementById("menuHamburguesa");
  menu.classList.toggle("menu-visible");

  if (!menu.classList.contains("menu-visible")) return;

  menu.innerHTML = `
    <p><strong>Administrador:</strong><br>${escapeHtml(correoAdmin)}</p>
    <div style="margin-top: 15px;">
      <button onclick="irSolicitudes()" style="
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
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]
  ));
}

function irSolicitudes() {
  window.location.href = "solicitudes.html";
}

function cerrarSesion() {
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.href = "inicio.html";
  }).catch(error => {
    alert("Error al cerrar sesión: " + error.message);
  });
}

// ---------- Toggle permisos ----------
function togglePermiso(btn) {
  if (btn.classList.contains("activo")) {
    btn.classList.remove("activo");
    btn.classList.add("inactivo");
  } else {
    btn.classList.remove("inactivo");
    btn.classList.add("activo");
  }
}

// ---------- Registrar subadmin ----------
function registrarSubadmin() {
  const nombre = document.getElementById("nombre").value.trim();
  const escuela = document.getElementById("escuela").value.trim();
  const correo = document.getElementById("correo").value.trim();

  const permisoVer = document.getElementById("permisoVer").checked;
  const permisoEditar = document.getElementById("permisoEditar").checked;

  if (!nombre || !escuela || !correo) {
    document.getElementById("mensaje").style.color = "red";
    document.getElementById("mensaje").innerText = "Por favor completa todos los campos.";
    return;
  }

  db.collection("subadministradores").add({
    nombre,
    escuela,
    correo,
    permisos: {
      ver: permisoVer,
      editar: permisoEditar
    },
    creadoPor: correoAdmin,
    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    document.getElementById("mensaje").style.color = "green";
    document.getElementById("mensaje").innerText = "Subadministrador registrado correctamente.";
    document.getElementById("nombre").value = "";
    document.getElementById("escuela").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("permisoVer").checked = false;
    document.getElementById("permisoEditar").checked = false;
  })
  .catch(error => {
    document.getElementById("mensaje").style.color = "red";
    document.getElementById("mensaje").innerText = "Error: " + error.message;
  });
}
