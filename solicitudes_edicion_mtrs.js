// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUJoaaQx8vSEIGWOE1ha-PtrAN7UUs-GU",
    authDomain: "internacionalizacionuagro25.firebaseapp.com",
    projectId: "internacionalizacionuagro25",
    storageBucket: "internacionalizacionuagro25.appspot.com",
    messagingSenderId: "645053345489",
    appId: "1:645053345489:web:f346ee82b0d26dcf46dff0",
    measurementId: "G-PJDRJWTB0R"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const contenedor = document.getElementById("solicitudes");

async function cargarSolicitudes() {
    contenedor.innerHTML = "<p>Cargando solicitudes...</p>";

    try {
        const maestrosSnap = await db.collection("maestros").get();
        contenedor.innerHTML = "";

        if (maestrosSnap.empty) {
            contenedor.innerHTML = "<p>No hay maestros registrados.</p>";
            return;
        }

        let solicitudesTotales = 0;

        for (const maestroDoc of maestrosSnap.docs) {
            const correoMaestro = maestroDoc.id; // ID = correo del maestro
            const solicitudesRef = maestroDoc.ref.collection("solicitudesEdicion").where("estado", "==", "pendiente");
            const solicitudesSnap = await solicitudesRef.get();

            if (solicitudesSnap.empty) continue;

            // Obtener datos de fichaIdentificacion
            const fichaSnap = await maestroDoc.ref.collection("fichaIdentificacion").get();
            let datosPerfil = {};
            if (!fichaSnap.empty) {
                fichaSnap.docs.forEach(doc => datosPerfil = { ...datosPerfil, ...doc.data() });
            }

            solicitudesSnap.docs.forEach(solDoc => {
                const solData = solDoc.data();

                const card = document.createElement("div");
                card.className = "solicitud-card";

                card.innerHTML = `
          <img src="${datosPerfil.fotoPerfil || 'https://via.placeholder.com/100'}" alt="Foto perfil">
          <div class="solicitud-info">
            <p><strong>Nombre:</strong> ${datosPerfil.nombreCompleto || 'Sin nombre'}</p>
            <p><strong>Correo:</strong> ${maestroDoc.data().correo || correoMaestro}</p>
            <p><strong>Institución:</strong> ${datosPerfil.institucion || 'No especificado'}</p>
            <p><strong>Fecha solicitud:</strong> ${solData.fecha.toDate().toLocaleString()}</p>
          </div>
          <div class="solicitud-botones">
            <button class="aprobar">Aprobar</button>
            <button class="rechazar">Rechazar</button>
          </div>
        `;

                card.querySelector(".aprobar").onclick = async () => {
                    await solDoc.ref.update({ estado: "aprobado" });
                    card.remove();
                };
                card.querySelector(".rechazar").onclick = async () => {
                    await solDoc.ref.update({ estado: "rechazado" });
                    card.remove();
                };

                contenedor.appendChild(card);
                solicitudesTotales++;
            });
        }

        if (solicitudesTotales === 0) {
            contenedor.innerHTML = "<p>No hay solicitudes pendientes.</p>";
        }

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = "<p>Error al cargar las solicitudes.</p>";
    }
}

// Inicializar
cargarSolicitudes();
