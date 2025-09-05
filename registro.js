// ----------------- CONFIGURACIÓN DE FIREBASE -----------------
const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let passwordGenerada = "";

// ----------------- GENERAR CONTRASEÑA -----------------
function generarContrasena() {
  const caracteres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*/";
  let contrasena = "";

  while (
    !(/[A-Z]/.test(contrasena) &&
      /[a-z]/.test(contrasena) &&
      /[0-9]/.test(contrasena) &&
      /[!@#$%*/]/.test(contrasena))
  ) {
    contrasena = "";
    for (let i = 0; i < 8; i++) {
      contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
  }

  passwordGenerada = contrasena;
  document.getElementById("passwordDisplay").innerText = `Contraseña generada: ${contrasena}`;
}

// ----------------- REGISTRO MANUAL -----------------
function registrarManual() {
  const email = document.getElementById("email").value.trim();

  if (!email || !passwordGenerada) {
    alert("Por favor genera una contraseña y proporciona un correo.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, passwordGenerada)
    .then(() => {
      // Enviar contraseña al correo con EmailJS
      return emailjs.send("service_d3asbgb", "template_u57uxv4", {
        to_email: email,
        mensaje: passwordGenerada
      }).catch(err => {
        console.warn("Correo no enviado:", err);
      });
    })
    .then(() => {
      // Guardar correo en Firestore
      const docId = email.replace(/[.#$[\]@]/g, "_");
      return db.collection("maestros").doc(docId).set({ correo: email });
    })
    .then(() => {
      localStorage.setItem("correoMaestro", email);
      alert("¡Registro exitoso! Tu contraseña fue enviada a tu correo.");
      window.location.href = "fichaMaestro.html";
    })
    .catch((error) => {
      console.error("Error final:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Este correo ya está registrado. Te redirigiremos a iniciar sesión.");
        window.location.href = "iniciar_sesion.html";
      } else {
        alert("Error: " + error.message);
      }
    });
}

// ----------------- REGISTRO CON GOOGLE -----------------
function registrarConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const correo = result.user.email;
      const docId = correo.replace(/[.#$[\]@]/g, "_");
      return db.collection("maestros").doc(docId).set({ correo }).then(() => {
        localStorage.setItem("correoMaestro", correo);
        window.location.href = "fichaMaestro.html";
      });
    })
    .catch(e => alert(e.message));
}
