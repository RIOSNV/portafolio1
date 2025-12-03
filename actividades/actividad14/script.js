const mensaje = document.getElementById('mensaje');
const charCount = document.querySelector('.char-count');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');

// Actualizar contador de caracteres y matriz del mensaje
mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    charCount.textContent = `${len}/30`;
    mostrarMatrizMensaje();
});

// Mostrar matriz del mensaje (en números, agrupados de 2 en 2)
function mostrarMatrizMensaje() {
    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (texto.length === 0) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }
    
    const valores = texto.split('').map(char => char.charCodeAt(0) - 65);
    
    let matriz = '[';
    for (let i = 0; i < valores.length; i += 2) {
        if (i > 0) matriz += ' ';
        matriz += '[' + valores[i];
        if (i + 1 < valores.length) {
            matriz += ', ' + valores[i + 1];
        } else {
            // Padding con 'X' (23) si falta un elemento
            matriz += ', 23';
        }
        matriz += ']';
    }
    matriz += ']';
    
    matrizMensaje.textContent = matriz;
}

// ================= ENCRIPTAR (Hill 2x2) =================
btnEncriptar.addEventListener('click', () => {
    limpiarError();

    const key = leerMatrizClave();
    if (!key) return;

    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (texto.length === 0) {
        mostrarError('Error: Ingresa un mensaje');
        return;
    }

    // Convertir texto a números
    let numeros = texto.split('').map(char => char.charCodeAt(0) - 65);

    // Padding si la longitud es impar
    if (numeros.length % 2 !== 0) {
        numeros.push(23); // 'X'
    }

    let encriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i];
        const v2 = numeros[i + 1];

        const c1 = (key[0][0] * v1 + key[0][1] * v2) % 26;
        const c2 = (key[1][0] * v1 + key[1][1] * v2) % 26;

        encriptado += String.fromCharCode(65 + (c1 + 26) % 26);
        encriptado += String.fromCharCode(65 + (c2 + 26) % 26);
    }

    resultado.textContent = encriptado;
});

// ================= DESENCRIPTAR (Hill 2x2) =================

// inverso modular de 'a' módulo 'm'
function modInverse(a, m) {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) {
            return x;
        }
    }
    return null;
}

// Leer matriz clave y validar que sea invertible (para encriptar y desencriptar)
function leerMatrizClave() {
    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    if (key[0][0] === 0 && key[0][1] === 0 && key[1][0] === 0 && key[1][1] === 0) {
        mostrarError('Error: Ingresa una matriz clave válida');
        return null;
    }

    // Determinante mod 26
    let det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;
    if (det < 0) det += 26;

    if (det === 0) {
        mostrarError('Error: La matriz no es invertible (determinante = 0)');
        return null;
    }

    // Para encriptar no es obligatorio checar el inverso,
    // pero lo validamos para asegurar que sirva también para desencriptar.
    const detInv = modInverse(det, 26);
    if (detInv === null) {
        mostrarError('Error: La matriz no es invertible módulo 26');
        return null;
    }

    // Guardamos el inverso del determinante dentro del objeto key por si hace falta
    key.det = det;
    key.detInv = detInv;
    return key;
}

// Botón de DESENCRIPTAR
btnDesencriptar.addEventListener('click', () => {
    limpiarError();

    const key = leerMatrizClave();
    if (!key) return;

    const detInv = key.detInv;

    // Construir matriz inversa K^-1 = (1/det) * [d -b; -c a] mod 26
    let invKey = [
        [
            (detInv * key[1][1]) % 26,
            (detInv * (-key[0][1])) % 26
        ],
        [
            (detInv * (-key[1][0])) % 26,
            (detInv * key[0][0]) % 26
        ]
    ];
    // Normalizar a 0–25
    invKey = invKey.map(row => row.map(v => (v + 26) % 26));

    // 🔹 Primero intentamos tomar el TEXTO CIFRADO del resultado
    let texto = resultado.textContent.trim();

    // Si no hay nada en resultado, usamos el textarea como respaldo
    if (!texto) {
        texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    } else {
        texto = texto.toUpperCase().replace(/[^A-Z]/g, '');
    }

    if (texto.length === 0) {
        mostrarError('Error: Ingresa el texto encriptado (en el resultado o en el cuadro de mensaje)');
        return;
    }

    // Convertir texto cifrado a números
    let numeros = texto.split('').map(char => char.charCodeAt(0) - 65);

    // Padding por si acaso
    if (numeros.length % 2 !== 0) {
        numeros.push(23); // 'X'
    }

    let desencriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const c1 = numeros[i];
        const c2 = numeros[i + 1];

        const p1 = (invKey[0][0] * c1 + invKey[0][1] * c2) % 26;
        const p2 = (invKey[1][0] * c1 + invKey[1][1] * c2) % 26;

        desencriptado += String.fromCharCode(65 + (p1 + 26) % 26);
        desencriptado += String.fromCharCode(65 + (p2 + 26) % 26);
    }

    // Mostrar texto desencriptado
    resultado.classList.remove('error');
    resultado.textContent = desencriptado;

    // También lo ponemos en el textarea y actualizamos la matriz
    mensaje.value = desencriptado;
    mostrarMatrizMensaje();
});

// ================= Helpers de errores =================
function mostrarError(msg) {
    resultado.textContent = msg;
    resultado.classList.add('error');
}

function limpiarError() {
    resultado.classList.remove('error');
    // NO borramos el texto, solo quitamos el estilo de error
}
