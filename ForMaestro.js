const firebaseConfig = {
    apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
    authDomain: "internacionalizacionuagro25.firebaseapp.com",
    projectId: "internacionalizacionuagro25",
    storageBucket: "internacionalizacionuagro25.appspot.com",
    messagingSenderId: "645053345489",
    appId: "1:645053345489:web:f346ee82b0d26dcf46dff0",
    measurementId: "G-PJDRJWTB0R"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

document.getElementById("fichaForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const mensaje = document.getElementById("mensaje");

    if (!nombre) {
        mensaje.textContent = "El nombre no puede estar vacío.";
        mensaje.className = "mensaje-error";
        return;
    }

    const idSeguro = nombre.replace(/[.#$/[\]]/g, "_");

    try {
        // Subir imagen
        const fotoArchivo = document.getElementById("foto").files[0];
        let fotoURL = "";
        if (fotoArchivo) {
            const storageRef = storage.ref(`fotos_profesores/${Date.now()}_${fotoArchivo.name}`);
            await storageRef.put(fotoArchivo);
            fotoURL = await storageRef.getDownloadURL();
        }

        // Crear el objeto con los datos
        const datos = {
            institucion: document.getElementById("institucion").value,
            programas: document.getElementById("programas").value,
            facultad: document.getElementById("facultad").value,
            academia: document.getElementById("academia").value,
            agostoEnero: document.getElementById("agostoEnero").value,
            febreroJulio: document.getElementById("febreroJulio").value,
            otroPeriodo: document.getElementById("otroPeriodo").value,
            preferencia: document.getElementById("preferencia").value,
            interesUAP: document.getElementById("interesUAP").value,
            duracion: parseInt(document.getElementById("duracion").value),
            tipoIntercambio: document.getElementById("tipoIntercambio").value,
            promedioEstudiantes: parseInt(document.getElementById("promedioEstudiantes").value),
            idiomas: document.getElementById("idiomas").value,
            contacto: document.getElementById("contacto").value,
            fotoURL: fotoURL,
            fechaRegistro: new Date().toISOString()
        };

        // Guardar dentro de una subcolección
        await db.collection("fichas_profesores")
                .doc(idSeguro)
                .collection("datos_registrados")
                .add(datos);

        mensaje.textContent = "✅ Ficha guardada correctamente.";
        mensaje.className = "mensaje-exito";
        document.getElementById("fichaForm").reset();

        setTimeout(() => {
            mensaje.textContent = "";
            mensaje.className = "";
        }, 5000);
    } catch (error) {
        console.error("Error al guardar:", error);
        mensaje.textContent = "❌ Error al guardar. Revisa la consola.";
        mensaje.className = "mensaje-error";

        setTimeout(() => {
            mensaje.textContent = "";
            mensaje.className = "";
        }, 5000);
    }
});
