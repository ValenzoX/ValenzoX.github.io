const firebaseConfig = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let generatedPassword = "";

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*/";
  let password = "";

  while (
    !(/[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%*/]/.test(password))
  ) {
    password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  generatedPassword = password;
  document.getElementById("passwordDisplay").innerText = `Generated password: ${password}`;
}

function registerManual() {
  const email = document.getElementById("email").value.trim();

  if (!email || !generatedPassword) {
    alert("Please provide an email and generate a password.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, generatedPassword)
    .then(() => {
      // Send password via EmailJS
      return emailjs.send("service_d3asbgb", "template_u57uxv4", {
        to_email: email,
        mensaje: generatedPassword
      }).catch(err => {
        console.warn("Email not sent:", err);
      });
    })
    .then(() => {
      // Save to Firestore
      const docId = email.replace(/[.#$[\]@]/g, "_");
      return db.collection("maestros").doc(docId).set({
        correo: email,
        idioma: "ingles"
      });
    })
    .then(() => {
      localStorage.setItem("correoMaestro", email);
      alert("Registration successful! Your password was sent to your email and your data was saved.");
      window.location.href = "fichaMaestro_en_ingles.html";
    })
    .catch((error) => {
      console.error("Final error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered. Redirecting to login.");
        window.location.href = "iniciar_sesion.html";
      } else {
        alert("Error: " + error.message);
      }
    });
}

function registerWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const email = result.user.email;
      const docId = email.replace(/[.#$[\]@]/g, "_");
      return db.collection("maestros").doc(docId).set({ correo: email, idioma: "ingles" }).then(() => {
        localStorage.setItem("correoMaestro", email);
        window.location.href = "fichaMaestro_en_ingles.html";
      });
    })
    .catch(e => alert(e.message));
}
