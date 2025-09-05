const firebaseConfigFicha = {
  apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
  authDomain: "internacionalizacionuagro25.firebaseapp.com",
  projectId: "internacionalizacionuagro25",
};

firebase.initializeApp(firebaseConfigFicha);
const dbFicha = firebase.firestore();

// Cloudinary config
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcxhk1f1l/upload";
const CLOUDINARY_UPLOAD_PRESET = "ficha_maestro_preset";

async function saveForm() {
  const name = document.getElementById("nombreCompleto").value.trim();
  const email = localStorage.getItem("correoMaestro");

  if (!email || !name) {
    alert("Missing data");
    return;
  }

  const docId = email.replace(/[.#$[\]@]/g, "_");

  // Upload profile photo
  const file = document.getElementById("fotoPerfil").files[0];
  let photoUrl = "";

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "teacher_profiles");

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      photoUrl = data.secure_url;
    } catch (e) {
      alert("Error uploading image to Cloudinary");
      return;
    }
  }

  // Multiple courses
  const descAgo = document.querySelectorAll(".descripcionAgostoEnero");
  const fechasAgo = document.querySelectorAll(".fechaAgostoEnero");
  const coursesAugJan = [];
  for (let i = 0; i < descAgo.length; i++) {
    const desc = descAgo[i].value.trim();
    const fecha = fechasAgo[i].value.trim();
    if (desc && fecha) {
      coursesAugJan.push({ description: desc, date: fecha });
    }
  }

  const descFeb = document.querySelectorAll(".descripcionFebreroJulio");
  const fechasFeb = document.querySelectorAll(".fechaFebreroJulio");
  const coursesFebJul = [];
  for (let i = 0; i < descFeb.length; i++) {
    const desc = descFeb[i].value.trim();
    const fecha = fechasFeb[i].value.trim();
    if (desc && fecha) {
      coursesFebJul.push({ description: desc, date: fecha });
    }
  }

  // Full data
  const data = {
    fullName: name,
    degree: document.getElementById("grado").value.trim(),
    institution: document.getElementById("institucion").value.trim(),
    programs: document.getElementById("programas").value.trim(),
    modalities: document.getElementById("modalidades").value.trim(),
    faculty: document.getElementById("facultadAdscripción").value.trim(),
    academicField: document.getElementById("formacionAcademica").value.trim(),
    coursesAugJan,
    coursesFebJul,
    otherCourses: document.getElementById("asignaturasOtroPeriodo").value.trim(),
    preferredSemester: document.getElementById("semestrePreferido").value.trim(),
    coilInterest: document.getElementById("interesUAP").value.trim(),
    collaborationDuration: document.getElementById("duracionColaboracion").value.trim(),
    exchangeType: document.getElementById("tipoIntercambio").value.trim(),
    averageStudents: document.getElementById("promedioEstudiantes").value.trim(),
    languages: document.getElementById("idiomas").value.trim(),
    contactEmail: document.getElementById("contactoCorreo").value.trim(),
    contactPhone: document.getElementById("contactoTelefono").value.trim(),
    contactSocial: document.getElementById("contactoRedes").value.trim(),
    profilePhoto: photoUrl
  };

  dbFicha.collection("maestros").doc(docId)
    .collection("fichaIdentificacion").doc("principal")
    .set(data)
    .then(() => {
      document.getElementById("mensaje").innerText = "Data saved successfully";
      setTimeout(() => {
        window.location.href = "miPerfil.html";
      }, 1500);
    })
    .catch((e) => {
      alert("Error saving: " + e.message);
    });
}

// ➕ Add extra fields
function addCourseAgostoEnero() {
  const container = document.getElementById("asignaturasAgostoEnero");
  const newGroup = document.createElement("div");
  newGroup.classList.add("asignaturaGrupo");
  newGroup.innerHTML = `
    <input type="text" class="descripcionAgostoEnero" placeholder="Course description">
    <input type="text" class="fechaAgostoEnero" placeholder="Dates (e.g. Aug 2025 - Jan 2026)">
  `;
  container.appendChild(newGroup);
}

function addCourseFebreroJulio() {
  const container = document.getElementById("asignaturasFebreroJulio");
  const newGroup = document.createElement("div");
  newGroup.classList.add("asignaturaGrupo");
  newGroup.innerHTML = `
    <input type="text" class="descripcionFebreroJulio" placeholder="Course description">
    <input type="text" class="fechaFebreroJulio" placeholder="Dates (e.g. Feb 2026 - Jul 2026)">
  `;
  container.appendChild(newGroup);
}
