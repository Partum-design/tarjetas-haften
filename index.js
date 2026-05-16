const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');

const dataFile = path.join(__dirname, 'data.txt');
const templateFile = path.join(__dirname, 'template.html');
const distDir = path.join(__dirname, 'dist');
const fotosDir = path.join(__dirname, 'fotos');
const excelAuthorityFile = path.join(__dirname, 'base_datos', '2026 FORMATO REQUERIMIENTOS DATOS CREDENCIALIZACION.xlsx');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

function fixMojibake(text) {
    if (!text) return text;
    if (!/[ÃÂâ€�]/.test(text)) return text;

    const repaired = Buffer.from(text, 'latin1').toString('utf8');
    const originalNoise = (text.match(/[ÃÂâ€�]/g) || []).length;
    const repairedNoise = (repaired.match(/[ÃÂâ€�]/g) || []).length;

    return repairedNoise < originalNoise ? repaired : text;
}

const rawData = fixMojibake(fs.readFileSync(dataFile, 'utf8'));
const lines = rawData.split('\n').filter(line => line.trim() !== '');

let employees = [];
let currentEmployee = null;

const cleanValue = (val) => val ? val.trim() : '';

function normalizeSpacing(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

function stripAccents(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeAuthorityName(text) {
    return normalizeSpacing(stripAccents(text || '').toUpperCase())
        .replace(/\bING\.?\s+/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// FUNCIONES PARA NORMALIZACIÓN DE VISUALIZACIÓN
function capitalizeProperName(text) {
    if (!text) return text;
    // Convertir todos los nombres a MAYÚSCULAS
    return normalizeSpacing(text).toUpperCase();
}

function normalizeRoleToUpperCase(text) {
    if (!text) return text;
    return normalizeSpacing(text).toUpperCase();
}

function loadAuthorityEmployees() {
    const workbook = XLSX.readFile(excelAuthorityFile);
    const worksheet = workbook.Sheets['Tarjetas de acceso 2026'] || workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const supplementalEmployees = [
        {
            nombre: 'Ing. Alfonso Rivera López',
            puesto: 'DIRECTOR GENERAL',
            correo: 'alfonso.rivera@haften.com.mx',
            whatsapp: '5519918173',
            telefono: '5556381224'
        },
        {
            nombre: 'Rubén Quiroz Aldana',
            puesto: 'CONTADOR',
            correo: 'ruben.quiroz@haften.com.mx',
            whatsapp: '55 5638-1224',
            telefono: '55 5638-1224'
        },
        {
            nombre: 'Ana Alicia García Aguilar',
            puesto: 'RECEPCIÓN',
            correo: 'anali.garcia@haften.com.mx',
            whatsapp: '55 5638-1224',
            telefono: '55 5638-1224'
        }
    ];

    return rows
        .slice(2)
        .map((row) => ({
            nombre: normalizeSpacing(String(row[0] || '')),
            puesto: normalizeSpacing(String(row[1] || '')),
            correo: normalizeSpacing(String(row[2] || '')).toLowerCase(),
            whatsapp: normalizeSpacing(String(row[3] || '')),
            telefono: normalizeSpacing(String(row[4] || ''))
        }))
        .filter((row) => row.nombre)
        .concat(supplementalEmployees);
}

const authorityAliases = new Map([
    ['GUILLERMO GONZALEZ CHARREZ', 'GUILLERMO GONZALEZ CHAVEZ'],
    ['ING JORGE EDUARDO SOSA MARTINEZ', 'JORGE EDUARDO SOSA MARTINEZ'],
    ['PABLO PINA PACHECO', 'JORGE PABLO PINA PACHECO'],
    ['RODRIGO ALMARAZ OLMOZ', 'RODRIGO ALMARAZ OLMOS'],
    ['JUAN CARLOS RODRIGUEZ A', 'JUAN CARLOS RODRIGUEZ ARROYO'],
    ['ENRIQUE CHARREZ MEZQUITE', 'LUIS ENRIQUE CHARREZ MEZQUITE'],
    ['MARIO H ROMAN FLORES', 'MARIO HASSEL ROMAN FLORES'],
    ['ING ALFONSO RIVERA LOPEZ', 'ALFONSO RIVERA']
]);

const authorityEmployees = loadAuthorityEmployees();
const authorityByName = new Map(authorityEmployees.map((employee) => [normalizeAuthorityName(employee.nombre), employee]));
const authorityByEmail = new Map(
    authorityEmployees
        .filter((employee) => employee.correo)
        .map((employee) => [employee.correo.toLowerCase(), employee])
);

const employeeOverridesByEmail = {
    'alfonso.rivera@haften.com.mx': {
        nombre: 'Ing. ALFONSO RIVERA LÓPEZ',
        puesto: 'DIRECTOR GENERAL',
        correo: 'alfonso.rivera@haften.com.mx',
        whatsapp: '5519918173',
        telefono: '5556381224'
    },
    'jorge.sosa@haften.com.mx': {
        nombre: 'Ing. Jorge Eduardo Sosa Martínez',
        puesto: 'GERENTE DE APLICACIONES HVAC/R-BAS',
        correo: 'jorge.sosa@haften.com.mx',
        whatsapp: '5545118038',
        telefono: '5556381224'
    },
    'guillermo.gonzalez@haften.com.mx': {
        nombre: 'Guillermo González Chávez',
        puesto: 'COORDINADOR DE INGENIERÍA',
        correo: 'guillermo.gonzalez@haften.com.mx',
        whatsapp: '5580070402',
        telefono: '5556381224'
    },
    'enrique.charrez@haften.com.mx': {
        nombre: 'Enrique Charrez Mezquite',
        puesto: 'INGENIERO DE APLICACIÓN DE PRODUCTO / DIVISIÓN HVAC/R-BMS',
        correo: 'enrique.charrez@haften.com.mx',
        whatsapp: '5551837923',
        telefono: '5556381224'
    },
    'abril.martinez@haften.com.mx': {
        nombre: 'Abril Alejandra Martínez',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'abril.martinez@haften.com.mx',
        whatsapp: '525580070414',
        telefono: '5556381224'
    },
    'milton.garcia@haften.com.mx': {
        nombre: 'Milton Asiel Garcia Ortega',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'milton.garcia@haften.com.mx',
        whatsapp: '525580070400',
        telefono: '5556381224'
    },
    'esteban.cano@haften.com.mx': {
        nombre: 'Esteban Cano Roa',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'esteban.cano@haften.com.mx',
        whatsapp: '5599115891',
        telefono: '5556381224'
    },
    'itzel.islas@haften.com.mx': {
        nombre: 'Itzel Islas Solís',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'Itzel.islas@haften.com.mx',
        whatsapp: '5599115864',
        telefono: '5556381224'
    },
    'juan.gomez@haften.com.mx': {
        nombre: 'Juan Gómez Carmona',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'Juan.gomez@haften.com.mx',
        whatsapp: '525580070406',
        telefono: '5556381224'
    },
    'mariana.garcia@haften.com.mx': {
        nombre: 'Mariana García García',
        puesto: 'INGENIERO DE VENTAS JR',
        correo: 'mariana.garcia@haften.com.mx',
        whatsapp: '5599115895',
        telefono: '5556381224'
    },
    'juancarlos.rodriguez@haften.com.mx': {
        nombre: 'Juan Carlos Rodríguez Arroyo',
        puesto: 'GERENTE DE DESARROLLO DE NEGOCIOS',
        correo: 'juancarlos.rodriguez@haften.com.mx',
        whatsapp: '5513844896',
        telefono: '5556381224'
    },
    'pablo.pina@haften.com.mx': {
        nombre: 'Pablo Piña Pacheco',
        puesto: 'INGENIERO REGIONAL DESARROLLO DE NEGOCIOS ZONA OCCIDENTE',
        correo: 'pablo.pina@haften.com.mx',
        whatsapp: '5580070411',
        telefono: '5556381224'
    },
    'victor.contreras@haften.com.mx': {
        nombre: 'Víctor Hugo Contreras Castañeda',
        puesto: 'ING. DE PROYECTOS / REGIONAL DESARROLLO DE NEGOCIOS / ZONA CENTRO',
        correo: 'victor.contreras@haften.com.mx',
        whatsapp: '5554538121',
        telefono: '5556381224'
    },
    'david.gallardo@haften.com.mx': {
        nombre: 'Marcos David Gallardo Bautista',
        puesto: 'INGENIERO REGIONAL DESARROLLO DE NEGOCIOS / ZONA SURESTE',
        correo: 'david.gallardo@haften.com.mx',
        whatsapp: '9988458338',
        telefono: '5556381224'
    },
    'omar.isassi@haften.com.mx': {
        nombre: 'Omar Isassi García',
        puesto: 'INGENIERO REGIONAL DESARROLLO DE NEGOCIOS / ZONA NORESTE',
        correo: 'omar.isassi@haften.com.mx',
        whatsapp: '8118222385',
        telefono: '5556381224'
    },
    'erick.carrizales@haften.com.mx': {
        nombre: 'Erick Alberto Carrizales García',
        puesto: 'INGENIERO DE VENTAS JR / ZONA NORESTE',
        correo: 'Erick.carrizales@haften.com.mx',
        whatsapp: '8131050568',
        telefono: '5556381224'
    },
    'alberto.ramirez@haften.com.mx': {
        nombre: 'Edgar Alberto Ramírez Escamilla',
        puesto: 'INGENIERO LÍDER DE MARCA VAISALA',
        correo: 'alberto.ramirez@haften.com.mx',
        whatsapp: '5580070398',
        telefono: '5556381224'
    },
    'isael.vazquez@haften.com.mx': {
        nombre: 'Isael Vázquez de Jesús',
        puesto: 'INGENIERO LÍDER DE MARCA JOHNSON CONTROLS',
        correo: 'isael.vazquez@haften.com.mx',
        whatsapp: '5580070407',
        telefono: '5556381224'
    },
    'rodrigo.almaraz@haften.com.mx': {
        nombre: 'Rodrigo Almaraz Olmos',
        puesto: 'GERENTE DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
        correo: 'rodrigo.almaraz@haften.com.mx',
        whatsapp: '5580070399',
        telefono: '5556381224'
    },
    'mario.roman@haften.com.mx': {
        nombre: 'Mario Hassel Román Flores',
        puesto: 'INGENIERO DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
        correo: 'mario.roman@haften.com.mx',
        whatsapp: '5580141521',
        telefono: '5556381224'
    },
    'marco.rojas@haften.com.mx': {
        nombre: 'Marco Antonio Rojas Nava',
        puesto: 'INGENIERO DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
        correo: 'marco.rojas@haften.com.mx',
        whatsapp: '5554374797',
        telefono: '5556381224'
    }
    ,
    'laura.mendez@haften.com.mx': {
        nombre: 'Laura Elizabeth Méndez Martínez',
        puesto: 'LIC. MARKETING',
        correo: 'laura.mendez@haften.com.mx',
        whatsapp: '5580070413',
        telefono: '5556381224'
    },
    'servando.gomez@haften.com.mx': {
        nombre: 'Servando Gómez Rivera',
        puesto: 'JEFE DE LOGÍSTICA',
        correo: 'servando.gomez@haften.com.mx',
        whatsapp: '5580632855',
        telefono: '5556381224'
    }
};

function resolveAuthorityEmployee({ nombre, correo }) {
    const emailKey = normalizeSpacing((correo || '').toLowerCase());
    if (emailKey && authorityByEmail.has(emailKey)) {
        return authorityByEmail.get(emailKey);
    }

    const normalizedName = normalizeAuthorityName(nombre);
    const aliasName = authorityAliases.get(normalizedName) || normalizedName;
    return authorityByName.get(aliasName) || null;
}

const accentedWordMap = {
    'BELEN': 'BEL\u00c9N',
    'FABIAN': 'FABI\u00c1N',
    'ANGELICA': 'ANG\u00c9LICA',
    'APLICACION': 'APLICACI\u00d3N',
    'ADMINISTRACION': 'ADMINISTRACI\u00d3N',
    'BAJIO': 'BAJ\u00cdO',
    'CASTANEDA': 'CASTA\u00d1EDA',
    'CHAVEZ': 'CH\u00c1VEZ',
    'CHARREZ': 'CH\u00c1RREZ',
    'DIAZ': 'D\u00cdAZ',
    'DIVISION': 'DIVISI\u00d3N',
    'ENERGIA': 'ENERG\u00cdA',
    'GARCIA': 'GARC\u00cdA',
    'GOMEZ': 'G\u00d3MEZ',
    'GONZALEZ': 'GONZ\u00c1LEZ',
    'HERNANDEZ': 'HERN\u00c1NDEZ',
    'INGENIERIA': 'INGENIER\u00cdA',
    'JOSE': 'JOS\u00c9',
    'LOGISTICA': 'LOG\u00cdSTICA',
    'LOPEZ': 'L\u00d3PEZ',
    'MARTINEZ': 'MART\u00cdNEZ',
    'MEDICION': 'MEDICI\u00d3N',
    'MENDEZ': 'M\u00c9NDEZ',
    'PINA': 'PI\u00d1A',
    'RAMIREZ': 'RAM\u00cdREZ',
    'RAUL': 'RA\u00daL',
    'RODRIGUEZ': 'RODR\u00cdGUEZ',
    'ROMAN': 'ROM\u00c1N',
    'VAZQUEZ': 'V\u00c1ZQUEZ',
    'JESUS': 'JES\u00daS'
};

const fullNameCorrections = {
    'GUILLERMO GONZALES CHARREZ': 'GUILLERMO GONZ\u00c1LES CH\u00c1RREZ',
    'ITZEL ISLAS SOLIS': 'ITZEL ISLAS SOLIS',
    'MILTON ASIEL GARCIA ORTEGA': 'MILTON ASIEL GARCIA ORTEGA'
};

const likelyFirstNames = new Set([
    'ABRIL', 'ALEJANDRA', 'ALFONSO', 'ALBERTO', 'ARMANDO', 'BELEN', 'CARLOS', 'CIRILO',
    'DAVID', 'EDGAR', 'ELIZABETH', 'ENRIQUE', 'ERICK', 'ESTEBAN', 'FABIAN', 'FERNANDO',
    'GREGORIO', 'GUILLERMO', 'HANIN', 'HECTOR', 'ISAEL', 'ISRAEL', 'ITZEL', 'JORGE',
    'JOSE', 'JUAN', 'LAURA', 'LUIS', 'MAGALI', 'MARCO', 'MARCOS', 'MARIANA', 'MARIO',
    'MILTON', 'NANCY', 'NORMA', 'OMAR', 'PABLO', 'PAULINO', 'RAMIRO', 'RAUL', 'RODRIGO',
    'SERVANDO', 'VICTOR'
]);

function applyAccentsAndUpper(text) {
    const upper = normalizeSpacing(stripAccents(text).toUpperCase());
    return upper
        .split(' ')
        .map(token => accentedWordMap[token] || token)
        .join(' ');
}

function reorderNameToFirstNameLastName(name) {
    const tokens = normalizeSpacing(name).split(' ').filter(Boolean);
    if (tokens.length < 2) return name;

    const firstTokenBase = stripAccents(tokens[0].toUpperCase());
    if (likelyFirstNames.has(firstTokenBase)) return name;

    let firstNameStart = tokens.length - 1;
    while (firstNameStart >= 0 && likelyFirstNames.has(stripAccents(tokens[firstNameStart].toUpperCase()))) {
        firstNameStart--;
    }
    firstNameStart++;

    if (firstNameStart > 0 && firstNameStart < tokens.length) {
        const givenNames = tokens.slice(firstNameStart);
        const surnames = tokens.slice(0, firstNameStart);
        return [...givenNames, ...surnames].join(' ');
    }
    return name;
}

function normalizeEmployeeName(rawName) {
    if (!rawName) return '';
    let name = normalizeSpacing(rawName);
    name = name.replace(/\s*\([^)]*\)\s*/g, ' ');
    name = normalizeSpacing(name);
    const rawNormalizedKey = normalizeSpacing(stripAccents(name).toUpperCase());
    if (rawNormalizedKey === 'MILTON ASIEL GARCIA ORTEGA') {
        return 'MILTON ASIEL GARCIA ORTEGA';
    }
    name = reorderNameToFirstNameLastName(name);
    name = applyAccentsAndUpper(name);
    const normalizedKey = normalizeSpacing(stripAccents(name).toUpperCase());
    name = fullNameCorrections[normalizedKey] || name;
    return name;
}

lines.forEach(line => {
    if (line.includes('Base de Datos')) return; 
    if (line.includes('Puesto:') || line.includes('Correo:') || line.match(/WhatsApp|Celular/) || line.includes('Tel. Oficina:') || line.includes('NSS:') || line.includes('Tipo de Sangre:') || line.includes('CURP:')) {
        const [key, ...rest] = line.split(':');
        const val = cleanValue(rest.join(':'));
        
        let cleanedKey = key.toLowerCase();
        if (cleanedKey.includes('puesto')) currentEmployee.puesto = val;
        else if (cleanedKey.includes('correo')) currentEmployee.correo = val;
        else if (cleanedKey.includes('whatsapp') || cleanedKey.includes('celular')) {
            currentEmployee.whatsapp = val.replace(/[\s\-\(\)]/g, ''); 
        }
        else if (cleanedKey.includes('tel. oficina') || cleanedKey.includes('oficina')) {
            currentEmployee.telefono = val.replace(/[\s\-\(\)]/g, ''); 
        }
    } else {
        if (currentEmployee && currentEmployee.nombre) {
            currentEmployee.nombre = normalizeEmployeeName(currentEmployee.nombre);
            employees.push(currentEmployee);
        }
        const normalizedName = normalizeEmployeeName(line.trim());
        currentEmployee = {
            slug: slugify(normalizedName),
            nombre: normalizedName
        };
    }
});
if (currentEmployee && currentEmployee.nombre) {
    currentEmployee.nombre = normalizeEmployeeName(currentEmployee.nombre);
    employees.push(currentEmployee);
}

const seenAuthorityEmployees = new Set();
employees = employees.reduce((acc, employee) => {
    const authorityEmployee = resolveAuthorityEmployee(employee);
    if (!authorityEmployee) return acc;

    const authorityKey = normalizeAuthorityName(authorityEmployee.nombre);
    if (seenAuthorityEmployees.has(authorityKey)) return acc;
    seenAuthorityEmployees.add(authorityKey);

    acc.push({
        ...employee,
        slug: slugify(authorityEmployee.nombre),
        nombre: authorityEmployee.nombre,
        correo: authorityEmployee.correo || employee.correo,
        puesto: employee.puesto || authorityEmployee.puesto
    });
    return acc;
}, []);

employees = employees.map((employee) => {
    const emailKey = normalizeSpacing((employee.correo || '').toLowerCase());
    const override = employeeOverridesByEmail[emailKey];
    return override ? { ...employee, ...override } : employee;
});

function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
}

// ---------------------------------------------------------------------------------------------------------
// EXTRACT PHOTOS LOGIC
// ---------------------------------------------------------------------------------------------------------
let fotosMap = []; // { filepath, cleanName, baseArea, employeeFolder }

function cleanEmployeeFolderName(folderName) {
    return normalizeSpacing(folderName
        .replace(/^\d+[_\.\-]?\s*/, '')
        .replace(/[_\-]\s*(ADM|ADMI|CONT|CONTAB|ING|LOG|MARKETING)\s*\d*$/i, '')
        .replace(/\s*-\s*(ADM|ADMI|CONT|CONTAB|ING|LOG|MARKETING)\s*$/i, '')
        .replace(/ISSASI/i, 'ISASSI')
        .replace(/MORALESLUIS/i, 'MORALES LUIS')
        .replace(/GONZÁLES/i, 'GONZALEZ'));
}

function normalizePhotoPath(fullPath) {
    return stripAccents(fullPath).toLowerCase().trim().replace(/\\/g, '/');
}

function getFileHash(fullPath) {
    return crypto.createHash('sha1').update(fs.readFileSync(fullPath)).digest('hex').slice(0, 8);
}

function getExistingProfileAsset(dir) {
    if (!fs.existsSync(dir)) return null;
    return fs.readdirSync(dir).find(file => /^profile(?:-[a-f0-9]{8})?\.(jpg|jpeg|png)$/i.test(file)) || null;
}

function isProfileJpgPhoto(fullPath) {
    return normalizePhotoPath(fullPath).includes('/foto de perfil/jpg/');
}

function isEmployeeJpegPhoto(fullPath) {
    return normalizePhotoPath(fullPath).includes('/jpeg/');
}

function isDirectProfilePhoto(fullPath) {
    const relParts = path.relative(fotosDir, fullPath).split(path.sep);
    const fileName = stripAccents(path.basename(fullPath)).toLowerCase().trim();
    return relParts.length === 3 && fileName.includes('perfil');
}

function getPhotoCandidateScore(fullPath) {
    const normalizedPath = normalizePhotoPath(fullPath);
    const fileName = stripAccents(path.basename(fullPath)).toLowerCase().trim();

    if (isProfileJpgPhoto(fullPath)) return 0;
    if (isDirectProfilePhoto(fullPath)) return 0;
    if (normalizedPath.includes('/foto de perfil/') && fileName.includes('perfil')) return 1;
    if (isEmployeeJpegPhoto(fullPath)) return 2;
    if (normalizedPath.includes('/fotos editadas/')) return 3;
    if (fileName.includes('perfil')) return 3;
    if (normalizedPath.includes('/gafete/')) return 8;
    return 5;
}

function getPhotoMeta(fullPath) {
    if (!isProfileJpgPhoto(fullPath) && !isEmployeeJpegPhoto(fullPath) && !isDirectProfilePhoto(fullPath)) return null;

    const relParts = path.relative(fotosDir, fullPath).split(path.sep);
    if (relParts.length < 2) return null;

    const areaFolder = relParts[0];
    const employeeFolder = relParts[1];
    const areaNorm = stripAccents(areaFolder).toLowerCase().trim();

    if (!areaNorm.startsWith('area ')) return null;
    const employeeFolderNorm = stripAccents(employeeFolder).toLowerCase().trim();
    if (employeeFolderNorm.includes('grupales') || employeeFolderNorm.startsWith('fotos')) return null;

    return {
        areaFolder,
        employeeFolder,
        cleanName: cleanEmployeeFolderName(employeeFolder),
        baseArea: areaFolder.replace(/^ÁREA\s+/i, '')
    };
}

function findFotos(dir) {
    if (!fs.existsSync(dir)) return;
    let list = fs.readdirSync(dir);
    list.forEach(file => {
        let fullPath = path.join(dir, file);
        let stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findFotos(fullPath);
        } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpeg')) {
            const meta = getPhotoMeta(fullPath);
            if (!meta) return;
            
            fotosMap.push({
                fullPath: fullPath,
                relPath: path.relative(distDir, fullPath).replace(/\\/g, '/'), // Important: relative to distDir which is usually where index.html lives ... wait actually relative to inside dist/:slug
                cleanName: meta.cleanName,
                baseArea: meta.baseArea,
                parentFolder: meta.employeeFolder,
                employeeFolder: meta.employeeFolder,
                isProfileJpg: isProfileJpgPhoto(fullPath),
                score: getPhotoCandidateScore(fullPath)
            });
        }
    });
}

// Ensure fotosDir exists
if (fs.existsSync(fotosDir)) {
    findFotos(fotosDir);
}

// Normalize string to ignore accents and uppercase
const normalizeStr = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + cost,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
            );
        }
    }

    return matrix[b.length][a.length];
}

function areSimilarTokens(a, b) {
    if (a === b) return true;
    if (a.length < 5 || b.length < 5) return false;
    return levenshtein(a, b) <= 1;
}

let addedFromPhotos = 0;
const excludedEmployeeNames = new Set([
    'ALEJANDRA ROMERO MORALES',
    'HANIN ESCAMILLA',
    'NORMA ANGELICA CONTRERAS CASTANEDA',
    'CIRILO BOMAYE CATHI',
    'ELIZABETH HERNANDEZ FLORES',
    'RAMIRO ROMERO CHAVEZ',
    'RAUL CORIA AYALA'
]);

// Sort fotosMap to favor profile photos, then edited photos, then regular camera files.
fotosMap.sort((a,b) => {
    if (a.employeeFolder !== b.employeeFolder) return a.employeeFolder.localeCompare(b.employeeFolder);
    if (a.score !== b.score) return a.score - b.score;
    return a.fullPath.localeCompare(b.fullPath);
});
let mappedFolders = new Set();

fotosMap.forEach(foto => {
    if (mappedFolders.has(foto.employeeFolder)) return; // Only take one picture per employee folder
    
    // Find matching employee by word intersection
    let photoWords = normalizeStr(foto.cleanName).split(/\s+/).filter(w => w.length > 2);
    
    let foundEmp = null;
    let maxMatch = 0;

    employees.forEach(e => {
        let empWords = normalizeStr(e.nombre).split(/\s+/).filter(w => w.length > 2);
        
        let matchCount = 0;
        empWords.forEach(ew => {
            if (photoWords.some(pw => areSimilarTokens(ew, pw))) matchCount++;
        });

        // We require at least 2 words to match (e.g., "Laura" AND "Mendez"), or if the name is just 1 word, 1 match.
        let required = Math.min(2, empWords.length, photoWords.length);
        if (matchCount >= required && matchCount > maxMatch) {
            maxMatch = matchCount;
            foundEmp = e;
        }
    });
    
    if (foundEmp) {
        foundEmp.fotoPath = foto; // store the foto object
        mappedFolders.add(foto.employeeFolder);
    } else {
        // Creating missing employee only if absolutely no match
        let capitalize = normalizeEmployeeName(foto.cleanName);
        const normalizedCandidate = normalizeSpacing(stripAccents(capitalize).toUpperCase());
        if (excludedEmployeeNames.has(normalizedCandidate)) {
            mappedFolders.add(foto.employeeFolder);
            return;
        }
        const authorityEmployee = resolveAuthorityEmployee({ nombre: capitalize, correo: '' });
        if (!authorityEmployee) {
            mappedFolders.add(foto.employeeFolder);
            return;
        }
        const authorityKey = normalizeAuthorityName(authorityEmployee.nombre);
        if (seenAuthorityEmployees.has(authorityKey)) {
            mappedFolders.add(foto.employeeFolder);
            return;
        }
        let newEmp = {
            slug: slugify(authorityEmployee.nombre),
            nombre: authorityEmployee.nombre,
            puesto: authorityEmployee.puesto || ('Especialista en ' + foto.baseArea),
            correo: authorityEmployee.correo || (capitalize.split(' ')[0].toLowerCase() + '@haften.com.mx'),
            fotoPath: foto
        };
        employees.push(newEmp);
        seenAuthorityEmployees.add(authorityKey);
        mappedFolders.add(foto.employeeFolder);
        addedFromPhotos++;
        console.log(`[+] Añadido faltante recuperado desde la foto: ${newEmp.nombre}`);
    }
});


// ---------------------------------------------------------------------------------------------------------
// TEMPLATE ENGINE
// ---------------------------------------------------------------------------------------------------------
const template = fixMojibake(fs.readFileSync(templateFile, 'utf8'));
let generatedCount = 0;

const officeLocations = {
    monterrey: {
        sede: 'HAFTEN MONTERREY',
        direccion: 'Constitución 2050, Obispado, 64060 Monterrey, N.L.'
    },
    guadalajara: {
        sede: 'HAFTEN GUADALAJARA',
        direccion: 'Av. Miguel Hidalgo y Costilla 2430, Vallarta Nte., 44690 Zapopan, Jal.'
    },
    cdmx: {
        sede: 'Oficinas Centrales',
        direccion: 'C. Tehuantepec 125, Roma Sur, Cuauhtémoc, 06760 Ciudad de México, CDMX'
    }
};

const roleOverridesByEmail = {
    'mariana.garcia@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'juan.gomez@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'victor.contreras@haften.com.mx': 'ING. DE PROYECTOS / REGIONAL DESARROLLO DE NEGOCIOS / ZONA CENTRO',
    'enrique.charrez@haften.com.mx': 'INGENIERO DE APLICACIÓN DE PRODUCTO DIVISIÓN HVAC/R-BMS',
    'milton.garcia@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'isael.vazquez@haften.com.mx': 'INGENIERO LÍDER DE MARCA JOHNSON CONTROLS',
    'abril.martinez@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'esteban.cano@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'jorge.sosa@haften.com.mx': 'GERENTE DE APLICACIONES HVAC/R-BAS',
    'guillermo.gonzalez@haften.com.mx': 'COORDINADOR DE INGENIERÍA',
    'alberto.ramirez@haften.com.mx': 'INGENIERO LÍDER DE MARCA VAISALA',
    'itzel.islas@haften.com.mx': 'INGENIERO DE VENTAS JR',
    'omar.isassi@haften.com.mx': 'INGENIERO REGIONAL DESARROLLO DE NEGOCIOS ZONA NORESTE',
    'marco.rojas@haften.com.mx': 'INGENIERO DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
    'alfonso.rivera@haften.com.mx': 'DIRECTOR GENERAL',
    'pablo.pina@haften.com.mx': 'INGENIERO REGIONAL DESARROLLO DE NEGOCIOS ZONA OCCIDENTE',
    'juancarlos.rodriguez@haften.com.mx': 'GERENTE DE DESARROLLO DE NEGOCIOS',
    'rodrigo.almaraz@haften.com.mx': 'GERENTE DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
    'mario.roman@haften.com.mx': 'INGENIERO DE APLICACIÓN DE PRODUCTO / DIV. HUMIDIFICACIÓN, DESHUMIDIFICACIÓN Y CALEFACTORES ELÉCTRICOS',
    'israel.calixto@haften.com.mx': 'GERENTE DE ADMINISTRACIÓN',
    'fabian.luna@haften.com.mx': 'CUENTAS POR COBRAR',
    'nancy.saavedra@haften.com.mx': 'ASISTENTE ADMINISTRATIVO',
    'mariana.flores@haften.com.mx': 'ASISTENTE ADMINISTRATIVO',
    'laura.mendez@haften.com.mx': 'LIC. MARKETING',
    'servando.gomez@haften.com.mx': 'JEFE DE LOGÍSTICA',
    'erick.carrizales@haften.com.mx': 'INGENIERO DE VENTAS JR / ZONA NORESTE'
};

const displayNameOverridesByEmail = {
    'israel.calixto@haften.com.mx': 'L.C.P./ M.D.F ISRAEL CALIXTO REBOLLEDO'
};

const displayNameHtmlOverridesByEmail = {
    'israel.calixto@haften.com.mx': '<strong>L.C.P./ M.D.F</strong><br>ISRAEL CALIXTO REBOLLEDO'
};

function normalizeDisplayRole(role) {
    const normalizedRole = fixMojibake(normalizeSpacing(role || ''));
    // Convertir puestos a MAYÚSCULAS
    return normalizedRole.toUpperCase();
}

function getOfficeLocationForEmployee(emp) {
    const normalizedName = normalizeSpacing(stripAccents(emp.nombre || '').toUpperCase());
    let location = officeLocations.cdmx;

    if ([
        'OMAR ISASSI GARCIA',
        'ERICK ALBERTO CARRIZALES GARCIA'
    ].includes(normalizedName)) {
        location = officeLocations.monterrey;
    } else if ([
        'JUAN CARLOS RODRIGUEZ A.',
        'JUAN CARLOS RODRIGUEZ ARROYO',
        'PABLO PINA PACHECO'
    ].includes(normalizedName)) {
        location = officeLocations.guadalajara;
    }

    return {
        ...location,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.direccion)}`
    };
}

employees.filter(e => e.nombre).forEach(emp => {
    let finalHtml = template;
    const slug = emp.slug || slugify(emp.nombre);
    const userDistDir = path.join(distDir, slug);
    const emailKey = (emp.correo || '').toLowerCase();
    const exactOverride = employeeOverridesByEmail[emailKey];

    if (roleOverridesByEmail[emailKey]) {
        emp.puesto = roleOverridesByEmail[emailKey];
    }
    if (exactOverride) {
        emp.nombre = exactOverride.nombre || emp.nombre;
        emp.puesto = exactOverride.puesto || emp.puesto;
        emp.correo = exactOverride.correo || emp.correo;
        emp.whatsapp = exactOverride.whatsapp || emp.whatsapp;
        emp.telefono = exactOverride.telefono || emp.telefono;
    }
    if (emailKey === 'servando.gomez@haften.com.mx') {
        emp.puesto = 'Jefe de Logística';
    }
    emp.puesto = normalizeDisplayRole(emp.puesto);
    const officeLocation = getOfficeLocationForEmployee(emp);
    if (officeLocation.sede === 'Oficinas Centrales') {
        officeLocation.direccion = 'Tehuantepec 125, Roma Sur, 06760 Ciudad de México, CDMX, México';
        officeLocation.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeLocation.direccion)}`;
    }
    const displayName = capitalizeProperName(displayNameOverridesByEmail[emailKey] || emp.nombre);

    if (!fs.existsSync(userDistDir)) {
        fs.mkdirSync(userDistDir);
    }

    const nombreParts = displayName.split(' ');
    let nombreHTML = displayNameHtmlOverridesByEmail[emailKey] || displayName;
    if (!displayNameHtmlOverridesByEmail[emailKey] && nombreParts.length > 1) {
        const first = nombreParts.shift();
        nombreHTML = `<strong>${first}</strong> <br>${nombreParts.join(' ')}`;
    }
    
    // Construct the path so it works from `dist/slug/index.html` going all the way back to root `fotos/`
    let fotoHTML = '';
    let previewSrc = '';
    const existingProfileAsset = getExistingProfileAsset(userDistDir);
    if (emp.fotoPath) {
        // Remove prior generated profile assets so stale browser/CDN caches cannot point to an old image.
        fs.readdirSync(userDistDir)
            .filter(file => /^profile(?:-[a-f0-9]{8})?\.(jpg|jpeg|png)$/i.test(file))
            .forEach(file => fs.rmSync(path.join(userDistDir, file), { force: true }));

        // Copy the selected photo into the generated card folder to avoid fragile paths with accents/spaces.
        const photoExt = path.extname(emp.fotoPath.fullPath).toLowerCase() || '.jpg';
        const photoHash = getFileHash(emp.fotoPath.fullPath);
        const photoFileName = `profile-${photoHash}${photoExt}`;
        const copiedPhotoPath = path.join(userDistDir, photoFileName);
        fs.copyFileSync(emp.fotoPath.fullPath, copiedPhotoPath);

        fotoHTML = `<img src="./${photoFileName}" alt="${displayName}" class="profile-pic">`;
        previewSrc = `./dist/${slug}/${photoFileName}`;
    } else if (existingProfileAsset) {
        fotoHTML = `<img src="./${existingProfileAsset}" alt="${displayName}" class="profile-pic">`;
        previewSrc = `./dist/${slug}/${existingProfileAsset}`;
    } else {
        const initials = displayName.substring(0,2).toUpperCase();
        fotoHTML = `<div class="profile-icon">${initials}</div>`;
    }
    
    emp.previewSrc = previewSrc; // save for master index

    finalHtml = finalHtml.replace(/{{FOTO_HTML}}/g, fotoHTML);
    finalHtml = finalHtml.replace(/{{NOMBRE_HTML}}/g, nombreHTML);
    finalHtml = finalHtml.replace(/{{NOMBRE}}/g, displayName);
    finalHtml = finalHtml.replace(/{{PUESTO}}/g, emp.puesto || 'Haften Team');
    finalHtml = finalHtml.replace(/{{CORREO}}/g, emp.correo || '');
    finalHtml = finalHtml.replace(/{{WHATSAPP}}/g, emp.whatsapp || '');
    finalHtml = finalHtml.replace(/{{TELEFONO}}/g, emp.telefono || '');
    
    finalHtml = finalHtml.replace(/{{WS_DISPLAY}}/g, emp.whatsapp ? 'flex' : 'none');
    finalHtml = finalHtml.replace(/{{EMAIL_DISPLAY}}/g, emp.correo ? 'flex' : 'none');
    finalHtml = finalHtml.replace(/{{TEL_DISPLAY}}/g, emp.telefono ? 'flex' : 'none');
    finalHtml = finalHtml.replace(/{{MAPS_URL}}/g, officeLocation.mapsUrl);
    finalHtml = finalHtml.replace(/{{DIRECCION}}/g, officeLocation.direccion);
    finalHtml = finalHtml.replace(/{{SEDE}}/g, officeLocation.sede);

    const outputPath = path.join(userDistDir, 'index.html');
    fs.writeFileSync(outputPath, finalHtml);
    generatedCount++;
});

// Remove stale generated folders that no longer belong to a current employee.
const expectedSlugs = new Set(employees.filter(e => e.nombre).map(emp => emp.slug || slugify(emp.nombre)));
fs.readdirSync(distDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !expectedSlugs.has(entry.name))
    .forEach(entry => {
        fs.rmSync(path.join(distDir, entry.name), { recursive: true, force: true });
    });


// ---------------------------------------------------------------------------------------------------------
// MASTER DIRECTORY INDEX
// ---------------------------------------------------------------------------------------------------------
function getArea(puesto) {
    if (!puesto) return 'Otros';
    const p = puesto.toLowerCase();
    if (p.includes('ingenier') || p.includes('aplicación') || p.includes('hvac')) return 'Ingeniería';
    if (p.includes('ventas') || p.includes('negocios') || p.includes('comercial')) return 'Comercial y Ventas';
    if (p.includes('logística') || p.includes('almacén')) return 'Logística y Almacén';
    if (p.includes('admin') || p.includes('recepción') || p.includes('contable') || p.includes('contador') || p.includes('cobrar') || p.includes('l.a.f')) return 'Administración y Finanzas';
    if (p.includes('director') || p.includes('gerente')) return 'Dirección y Gerencia';
    if (p.includes('marketing') || p.includes('mercadotecnia')) return 'Marketing';
    return 'Especialistas';
}

const groupedEmployees = {};
employees.filter(e => e.nombre).forEach(emp => {
    const area = getArea(emp.puesto);
    if (!groupedEmployees[area]) groupedEmployees[area] = [];
    groupedEmployees[area].push(emp);
});

// Orden de áreas dictado por importancia
const areasOrder = [
    'Dirección y Gerencia',
    'Administración y Finanzas',
    'Comercial y Ventas',
    'Ingeniería',
    'Logística y Almacén',
    'Marketing',
    'Especialistas',
    'Otros'
];

// Función para jerarquizar puestos internamente
function getPuestoWeight(puesto) {
    if (!puesto) return 99;
    const p = puesto.toLowerCase();
    if (p.includes('director') || p.includes('ceo')) return 1;
    if (p.includes('gerente') || p.includes('manager')) return 2;
    if (p.includes('jefe') || p.includes('líder') || p.includes('coordinador')) return 3;
    if (p.includes('ingeniero') || p.includes('contador') || p.includes('especialista') || p.includes('ventas')) return 4;
    if (p.includes('auxiliar') || p.includes('asistente') || p.includes('recepcionista') || p.includes('becario') || p.includes('jr')) return 6;
    return 5;
}

let masterLinksHTML = '';
areasOrder.forEach(area => {
    if (!groupedEmployees[area] || groupedEmployees[area].length === 0) return;
    
    // Sort employees inside area by weight
    let emps = groupedEmployees[area];
    emps.sort((a, b) => {
        let weightA = getPuestoWeight(a.puesto);
        let weightB = getPuestoWeight(b.puesto);
        if (weightA !== weightB) return weightA - weightB;
        // If same weight, sort alphabetically
        return a.nombre.localeCompare(b.nombre);
    });

    masterLinksHTML += `<div class="area-group" data-area="${area}">`;
    masterLinksHTML += `<h2 class="area-title">${area}</h2>`;
    masterLinksHTML += `<div class="area-grid">`;
    emps.forEach(emp => {
        const slug = emp.slug || slugify(emp.nombre);
        const previewSrc = emp.previewSrc || '';
        
        let miniThumbnail = '';
        if(previewSrc) {
            miniThumbnail = `<div style="width:50px; height:50px; border-radius:50%; overflow:hidden; flex-shrink:0; margin-right:15px; border:2px solid #7C2A1E;">
                <img src="${previewSrc}" style="width:100%; height:100%; object-fit:cover; object-position:center 18%; transform:scale(1.14);" loading="lazy" decoding="async">
            </div>`;
        } else {
            miniThumbnail = `<div style="width:50px; height:50px; border-radius:50%; background:#7C2A1E; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:15px; font-weight:bold;">${capitalizeProperName(emp.nombre).substring(0,2)}</div>`;
        }
        
        const displayNameMaster = capitalizeProperName(emp.nombre);
        masterLinksHTML += `
            <a href="./dist/${slug}/index.html" class="list-item" data-nombre="${emp.nombre.toLowerCase()}" data-puesto="${(emp.puesto || '').toLowerCase()}">
                <div style="display:flex; align-items:center;">
                    ${miniThumbnail}
                    <div>
                        <strong>${displayNameMaster}</strong><br>
                        <small>${emp.puesto || ''}</small>
                    </div>
                </div>
            </a>
        `;
    });
    masterLinksHTML += `</div></div>`;
});

const masterHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Directorio de Tarjetas - Haften</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: #fdfdfd; padding: 40px 20px; text-align: center; color: #333; margin: 0; }
        h1 { color: #7C2A1E; font-size: 2.5rem; margin-bottom: 10px; font-weight: 700; letter-spacing: -0.5px;}
        
        .search-container { max-width: 600px; margin: 0 auto 40px auto; position: relative; }
        .search-icon { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); color: #888; font-size: 1.2rem; transition: 0.3s; }
        .search-input { width: 100%; padding: 18px 20px 18px 55px; font-size: 1.1rem; border: 2px solid transparent; border-radius: 40px; outline: none; background: #fff; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.04); font-family: 'Outfit', sans-serif;}
        .search-input:focus { border-color: rgba(124, 42, 30, 0.4); box-shadow: 0 15px 40px rgba(124, 42, 30, 0.1); transform: translateY(-2px); }
        .search-input:focus + .search-icon { color: #7C2A1E; }
        
        .directory-container { max-width: 1000px; margin: 0 auto; text-align: left; }
        .area-group { margin-bottom: 45px; animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        .area-group:nth-child(1) { animation-delay: 0.1s; }
        .area-group:nth-child(2) { animation-delay: 0.2s; }
        .area-group:nth-child(3) { animation-delay: 0.3s; }
        .area-group:nth-child(4) { animation-delay: 0.4s; }
        .area-group:nth-child(5) { animation-delay: 0.5s; }
        
        .area-title { color: #581d14; border-bottom: 2px solid #7C2A1E; padding-bottom: 8px; margin-bottom: 20px; font-size: 1.4rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;}
        .area-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        
        .list-item { background: white; padding: 25px; border-radius: 16px; text-decoration: none; color: #333; box-shadow: 0 5px 20px rgba(0,0,0,0.03); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); border: 1px solid rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; overflow: hidden;}
        .list-item::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 5px; background: #7C2A1E; transition: 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
        .list-item:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(124, 42, 30, 0.08); border-color: rgba(124, 42, 30, 0.1); }
        .list-item:hover::before { width: 8px; }
        .list-item strong { font-size: 1.15rem; margin-bottom: 6px; font-weight: 600; color: #111;}
        .list-item small { color: #777; line-height: 1.4; font-size: 0.9rem; font-weight: 300;}
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Ocultar elementos en la busqueda */
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <h1>Directorio Interno</h1>
    <p style="margin-bottom: 30px; color:#666; font-size: 1.1rem;">Encuentra y visualiza fácilmente la vCard de cualquier colaborador.</p>
    
    <div class="search-container">
        <input type="text" id="searchInput" class="search-input" placeholder="Buscar por nombre o puesto...">
        <i class="fas fa-search search-icon"></i>
    </div>

    <!-- Filter Bar -->
    <div class="filter-header" style="margin-bottom: 40px;">
        <button class="filter-btn active" data-filter="all">Todas las Áreas</button>
        <button class="filter-btn" data-filter="Administración y Finanzas">Administración</button>
        <button class="filter-btn" data-filter="Comercial y Ventas">Comercial</button>
        <button class="filter-btn" data-filter="Dirección y Gerencia">Dirección</button>
        <button class="filter-btn" data-filter="Ingeniería">Ingeniería</button>
        <button class="filter-btn" data-filter="Logística y Almacén">Logística</button>
        <button class="filter-btn" data-filter="Marketing">Marketing</button>
    </div>

    <style>
        .filter-header { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; padding: 0 20px;}
        .filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid #ddd; background: #fff; color: #555; cursor: pointer; transition: all 0.3s; font-family: 'Outfit'; font-weight: 600; font-size:0.9rem;}
        .filter-btn:hover { border-color: #7C2A1E; color: #7C2A1E; }
        .filter-btn.active { background: #7C2A1E; color: #fff; border-color: #7C2A1E; box-shadow: 0 4px 10px rgba(124,42,30,0.3); }
    </style>

    <div class="directory-container" id="directory">
        ${masterLinksHTML}
    </div>

    <script>
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                applyFilters();
            });
        });

        function applyFilters() {
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            const areas = document.querySelectorAll('.area-group');
            
            areas.forEach(group => {
                const groupArea = group.getAttribute('data-area');
                const items = group.querySelectorAll('.list-item');
                let hasVisible = false;

                // Match filter logic
                if (activeFilter !== 'all' && groupArea !== activeFilter) {
                    group.classList.add('hidden');
                    return;
                }
                
                items.forEach(item => {
                    const nombre = item.getAttribute('data-nombre').normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    const puesto = item.getAttribute('data-puesto').normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    const queryNorm = query.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    
                    if (nombre.includes(queryNorm) || puesto.includes(queryNorm)) {
                        item.classList.remove('hidden');
                        hasVisible = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });
                
                if (hasVisible) {
                    group.classList.remove('hidden');
                } else {
                    group.classList.add('hidden');
                }
            });
        }
    </script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), masterHtml);

console.log(`\n🎉 ¡Listo! Generadas ${generatedCount} tarjetas vCard en el directorio ./dist/`);
if (addedFromPhotos > 0) {
    console.log(`✨ Se agregaron exitosamente ${addedFromPhotos} empleados nuevos desde el catálogo de fotos.`);
}
console.log(`👉 Abre el archivo 'index.html' principal en esta carpeta para ver el directorio completo.`);
