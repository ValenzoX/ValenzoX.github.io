// 🔹 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 📌 Correo del superusuario
const CORREO_ADMIN = "21387744@uagro.mx";

// ===============================
// 🔹 Inicio de sesión manual
// ===============================
function iniciarSesionManual() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    document.getElementById("mensaje").innerText = "Por favor completa todos los campos.";
    return;
  }

  // Primero revisamos si existe en la BD
  verificarUsuarioEnBD(email, () => {
    // Si existe, intentamos iniciar sesión
    auth.signInWithEmailAndPassword(email, password)
      .then(() => guardarSesion(email))
      .catch(error => {
        document.getElementById("mensaje").innerText = "Error: " + error.message;
      });
  });
}

// ===============================
// 🔹 Inicio de sesión con Google
// ===============================
function iniciarSesionConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      const email = result.user.email;
      verificarUsuarioEnBD(email, () => {
        guardarSesion(email);
      });
    })
    .catch((error) => {
      // Personalizamos el mensaje según el código de error
      let mensaje = "Fallo de tu conexión, intenta de nuevo.";
      if (error.code === "auth/popup-blocked") {
        mensaje = "Autoriza abrir ventana emergente para iniciar sesión con Google.";
      }
      document.getElementById("mensaje").innerText = mensaje;
      console.error("Error con Google:", error);
    });
}


// ===============================
// 🔹 Verificar usuario en BD
// ===============================
function verificarUsuarioEnBD(email, callbackSiExiste) {
  db.collection("maestros").where("correo", "==", email).get()
    .then(snapshot => {
      if (!snapshot.empty) {
        callbackSiExiste(); // Usuario encontrado
      } else {
        // Guardamos el correo para mostrarlo en emergente.html
        localStorage.setItem("correoNoRegistrado", email);
        window.location.href = "emergente.html";
      }
    })
    .catch(error => {
      console.error("Error verificando usuario:", error);
      document.getElementById("mensaje").innerText = "Error verificando usuario.";
    });
}

// ===============================
// 🔹 Guardar datos en localStorage y redirigir
// ===============================
function guardarSesion(email) {
  localStorage.setItem("correoMaestro", email);

  if (email === CORREO_ADMIN) {
    localStorage.setItem("rol", "admin");
    window.location.href = "admin_inicio.html"; // Página del administrador
  } else {
    localStorage.setItem("rol", "maestro");
    window.location.href = "miPerfil.html"; // Página normal del maestro
  }
}
