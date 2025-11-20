/***************************************
 * ESTADO DE LA APLICACIÓN
 ***************************************/
let state = {
  location: "lima",
  documentType: "dni",
  installment: "1",
  fiberSpeed: null,
  sva: {
    fono: [],
    tv: [],
    mesh: [],
    winbox: []
  }
};

let currentUbigeoValue = "";
let ubigeoDisplayText = "";

/***************************************
 * FUNCIONES AUXILIARES
 ***************************************/
function updateUbigeoDisplay() {
  const ubigeoInput = document.getElementById("ubigeoInput");
  if (ubigeoInput) {
    const currentUbigeoValue = ubigeoInput.value.trim();
    const parts = [];

    if (currentUbigeoValue.length >= 2) {
      const deptCode = currentUbigeoValue.substr(0, 2);
      const deptData = ubigeoData[deptCode];
      if (deptData) {
        parts.push(`Departamento: ${deptData.departamento}`);
        if (currentUbigeoValue.length >= 4) {
          const provCode = currentUbigeoValue.substr(2, 2);
          const provData = deptData.provincias[provCode];
          if (provData) {
            parts.push(`Provincia: ${provData.provincia}`);
            if (currentUbigeoValue.length >= 6) {
              const distCode = currentUbigeoValue.substr(4, 2);
              const distName = provData.distritos[distCode];
              if (distName) {
                parts.push(`Distrito: ${distName}`);
              }
            }
          }
        }
      }
    }
    const ubigeoDisplay = document.getElementById("ubigeoDisplay");
    if (ubigeoDisplay) {
      ubigeoDisplay.innerText = parts.join(", ");
    }
  }
}

function getSelectSpeedText(speed, tipo) {
  if (speed === 600) return "600 Mbps Gamer";
  if (speed === 850.1) return "850 Mbps PROMO CONDOMINIO ESTRENO";
  if (speed === 1000.1) return "1000 Mbps PROMO CONDOMINIO ESTRENO";
  if (speed === 1000.2) return "1000 Mbps Gamer";
  if (speed === 1500) return "1.5 GB";
  if (speed === 2000) return "2.0 GB";
  if (speed === 2500) return "2.5 GB";
  return speed + " Mbps";
}

function getDisplaySpeed(speed) {
  if (speed === 850.1) return 850;
  if (speed === 1000.1 || speed === 1000.2) return 1000;
  if (speed === 1500) return "1.5 GB";
  if (speed === 2000) return "2.0 GB";
  if (speed === 2500) return "2.5 GB";
  return speed;
}

function getSVALabelAndDescription(optionKey, documentType) {
  for (let category in svaConstants) {
    if (svaConstants[category][optionKey]) {
      let description = svaConstants[category][optionKey].description;
      let label = svaConstants[category][optionKey].label;

      if (documentType === 'ruc') {
        description = description.replace(
          /<strong style="font-weight: bold; color: black;">Su nombre completo es<\/strong> <br>/g,
          '<strong style="font-weight: bold; color: black;">Nombre de la empresa (Razón social)</strong> <br>'
        );
        description = description.replace(
          /<strong style="font-weight: bold; color: black;">Su número de Documento de Identidad \/ CE \/ RUC \(10…\)<\/strong><br>/g,
          '<strong style="font-weight: bold; color: black;">Número de RUC (20…)</strong><br>'
        );
      }
      return { label: label, description: description };
    }
  }
  return { label: "", description: "" };
}

/***************************************
 * RENDERIZADO
 ***************************************/
function renderFiberPlans() {
  const fiberGrid = document.getElementById("fiberPlansGrid");
  let speeds = [];
  
  if (state.location === "lima") {
    speeds = state.documentType === "ruc" 
      ? [500, 750, 850, 1000]
      : [500, 600, 750, 850, 850.1, 1000, 1000.1, 1000.2, 1500, 2000, 2500];
  } else {
    speeds = state.documentType === "ruc"
      ? [550, 750, 1000]
      : [550, 750, 1000, 1000.1];
  }
  
  fiberGrid.innerHTML = speeds.map(speed => {
    const plan = config.pricing[state.location][speed];
    const isSelected = state.fiberSpeed === speed;
    let promoHTML = "";
    
    if (state.documentType !== "ruc") {
      if (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50") {
        promoHTML = `<div class="fiber-promo">S/ ${plan.pb_promo} 1er mes</div>`;
      } else if (plan.tipo === "promo_condominio") {
        promoHTML = `<div class="fiber-promo">S/ 1 x 2 meses</div>`;
      }
    }
    
    return `
      <div class="fiber-card ${isSelected ? 'selected' : ''}" data-fiber="${speed}">
        <div class="fiber-name">${getSelectSpeedText(speed, state.location)}</div>
        <div class="fiber-price">S/ ${plan.pb}</div>
        ${promoHTML}
      </div>
    `;
  }).join('');
  
  fiberGrid.querySelectorAll('.fiber-card').forEach(card => {
    card.addEventListener('click', function() {
      state.fiberSpeed = parseFloat(this.getAttribute('data-fiber'));
      renderFiberPlans();
      updateContract();
    });
  });
}

function updateSvaChips() {
  document.querySelectorAll('.chip-sva').forEach(chip => {
    const service = chip.getAttribute('data-service');
    const key = chip.getAttribute('data-key');
    
    if (service === 'tv' && key) {
      chip.classList.toggle('active', state.sva.tv.includes(key));
    } else if (service === 'fono') {
      chip.classList.toggle('active', state.sva.fono.length > 0);
    } else if (service === 'mesh') {
      chip.classList.toggle('active', state.sva.mesh.length > 0);
    } else if (service === 'winbox') {
      chip.classList.toggle('active', state.sva.winbox.length > 0);
    }
  });
}

/***************************************
 * MODAL SVA
 ***************************************/
function openSvaModal(service) {
  const modal = document.getElementById("svaModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  
  const serviceNames = {
    fono: "Fonowin",
    mesh: "Mesh",
    winbox: "Winbox"
  };
  
  modalTitle.textContent = `Seleccionar ${serviceNames[service]}`;
  
  const options = svaConstants[service];
  const isRadio = service === "fono" || service === "winbox";
  
  modalBody.innerHTML = Object.keys(options).map(key => {
    const option = options[key];
    const isSelected = state.sva[service].includes(key);
    const inputType = isRadio ? 'radio' : 'checkbox';
    const inputName = isRadio ? service : '';
    
    return `
      <div class="option-item ${isSelected ? 'selected' : ''}" data-key="${key}">
        <input type="${inputType}" ${inputName ? `name="${inputName}"` : ''} value="${key}" ${isSelected ? 'checked' : ''}>
        <span>${option.label}</span>
      </div>
    `;
  }).join('');
  
  modal.classList.remove('hidden');
  modal.setAttribute('data-service', service);
  
  modalBody.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', function() {
      const input = this.querySelector('input');
      input.checked = !input.checked;
      
      if (isRadio) {
        modalBody.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
        if (input.checked) this.classList.add('selected');
      } else {
        this.classList.toggle('selected', input.checked);
      }
    });
  });
}

function closeSvaModal(save = false) {
  const modal = document.getElementById("svaModal");
  const service = modal.getAttribute('data-service');
  
  if (save) {
    const selectedInputs = modal.querySelectorAll('input:checked');
    state.sva[service] = Array.from(selectedInputs).map(input => input.value);
    
    if (service === "mesh") {
      const groups = svaMutualExclusionRules.mesh || [];
      const selected = [...state.sva.mesh];
      selected.forEach(value => {
        groups.forEach(group => {
          if (group.includes(value)) {
            group.forEach(item => {
              if (item !== value) {
                const index = state.sva.mesh.indexOf(item);
                if (index > -1) state.sva.mesh.splice(index, 1);
              }
            });
          }
        });
      });
    }
    
    updateSvaChips();
    updateContract();
  }
  
  modal.classList.add('hidden');
}

/***************************************
 * GENERAR SPEECH
 ***************************************/
function generateSpeech(plan, fiberSpeed, documentType, selectedSvaOptions, installmentOption) {
  const planName = getDisplaySpeed(fiberSpeed);
  const isGamer = plan.tipo === "gamer_descuento50" || fiberSpeed === 600 || fiberSpeed === 1000.2;
  
  let precioFibraBase = plan.pb || 0;
  let precioFibraDescuento = 0;
  let tieneDctoFibra = false;
  let mesesDescuentoFibra = 1;
  let textoDuracionDescuento = "el primer mes";
  
  if (documentType !== "ruc") {
    if (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50") {
      tieneDctoFibra = true;
      precioFibraDescuento = plan.pb_promo || 0;
      mesesDescuentoFibra = 1;
      textoDuracionDescuento = "el primer mes";
    } else if (plan.tipo === "promo_condominio") {
      tieneDctoFibra = true;
      precioFibraDescuento = 1;
      mesesDescuentoFibra = 2;
      textoDuracionDescuento = "los primeros 2 meses";
    }
  }
  
  let servicios = [];
  let precioTvBase = 0;
  let precioTvDescuento = 0;
  let servicioTv = "";
  let tieneDctoTv = false;
  
  if (selectedSvaOptions.tv && selectedSvaOptions.tv.length > 0) {
    const tvKey = selectedSvaOptions.tv[0];
    servicioTv = svaConstants.tv[tvKey].label;
    servicios.push(servicioTv);
    
    const tvDesc = svaConstants.tv[tvKey].description;
    const matchPrecio = tvDesc.match(/El precio mensual de la suscripción es de <strong class="bold-keyword">S\/ ([0-9.]+)<\/strong>/);
    if (matchPrecio) {
      precioTvBase = parseFloat(matchPrecio[1]);
      
      if (documentType !== "ruc" && (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50")) {
        tieneDctoTv = true;
        precioTvDescuento = precioTvBase * 0.5;
      } else {
        precioTvDescuento = precioTvBase;
      }
    }
  }
  
  let precioFonoBase = 0;
  let precioFonoDescuento = 0;
  let servicioFono = "";
  let tieneDctoFono = false;
  
  if (selectedSvaOptions.fono && selectedSvaOptions.fono.length > 0) {
    const fonoKey = selectedSvaOptions.fono[0];
    servicioFono = "Fonowin";
    servicios.push(servicioFono);
    precioFonoBase = 10;
    
    if (fonoKey === "fono_1_promo") {
      tieneDctoFono = true;
      precioFonoDescuento = 1;
    } else {
      precioFonoDescuento = 10;
    }
  }
  
  let equipos = [];
  let precioEquipos = 0;
  let cantidadMesh = 0;
  let cantidadWinbox = 0;
  
  if (selectedSvaOptions.mesh && selectedSvaOptions.mesh.length > 0) {
    selectedSvaOptions.mesh.forEach(meshKey => {
      if (meshKey === "mesh_1_15") {
        cantidadMesh += 1;
        precioEquipos += 15;
      } else if (meshKey === "mesh_2_20") {
        cantidadMesh += 2;
        precioEquipos += 20;
      } else if (meshKey === "mesh_gratis") {
        cantidadMesh += 1;
      }
    });
  }
  
  if (cantidadMesh > 0) {
    equipos.push(cantidadMesh === 1 ? "1 Mesh" : `${cantidadMesh} Mesh`);
  }
  
  if (selectedSvaOptions.winbox && selectedSvaOptions.winbox.length > 0) {
    selectedSvaOptions.winbox.forEach(winboxKey => {
      if (winboxKey === "winbox_1_15") {
        cantidadWinbox += 1;
        precioEquipos += 15;
      } else if (winboxKey === "winbox_2_30") {
        cantidadWinbox += 2;
        precioEquipos += 30;
      }
    });
  }
  
  if (cantidadWinbox > 0) {
    equipos.push(cantidadWinbox === 1 ? "1 Winbox" : `${cantidadWinbox} Winbox`);
  }
  
  let precioRegularTotal = precioFibraBase + precioTvBase + precioFonoBase + precioEquipos;
  let precioDescuentoTotal = 0;
  
  if (tieneDctoFibra || tieneDctoTv || tieneDctoFono) {
    if (plan.tipo === "promo_condominio") {
      precioDescuentoTotal = 1 + precioFonoDescuento + precioEquipos;
    } else {
      precioDescuentoTotal = precioFibraDescuento + precioTvDescuento + precioFonoDescuento + precioEquipos;
    }
  }
  
  let speechText = `<strong>(Nombre del cliente)</strong>, queremos asegurarnos de que tengas toda la información clara desde el inicio. Antes de la lectura del contrato, voy a confirmarte `;
  
  if (equipos.length > 0) {
    speechText += `el plan, servicios y equipos contratados:<br><br>`;
  } else {
    speechText += `el plan y servicios contratados:<br><br>`;
  }
  
  if (isGamer) {
    speechText += `Es un plan Gamer de <strong class="bold-keyword">${planName} Mbps</strong>`;
  } else {
    speechText += `Es un plan de <strong class="bold-keyword">${planName} Mbps</strong>`;
  }
  
  if (servicios.length > 0) {
    if (servicios.length === 1) {
      speechText += `, con el servicio de <strong class="bold-keyword">${servicios[0]}</strong>`;
    } else {
      speechText += `, con los servicios de <strong class="bold-keyword">${servicios.join(" y ")}</strong>`;
    }
  }
  
  if (equipos.length > 0) {
    speechText += `, y los equipos <strong class="bold-keyword">${equipos.join(" y ")}</strong>`;
  }
  
  if (documentType === "ruc") {
    speechText += `. El precio mensual es de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
  } else {
    if (tieneDctoFibra || tieneDctoTv || tieneDctoFono) {
      speechText += `, por un precio promocional de <strong class="bold-keyword">S/ ${precioDescuentoTotal.toFixed(2)}</strong> durante ${textoDuracionDescuento}. Luego de este periodo, pagarás el precio regular de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
    } else {
      speechText += `, por un precio regular de <strong class="bold-keyword">S/ ${precioRegularTotal.toFixed(2)}</strong>`;
    }
  }
  
  if (documentType === "ruc") {
    if (installmentOption === "1") {
      speechText += ` y el precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, con un precio promocional de <strong class="bold-keyword">S/ 60.00</strong>`;
    } else if (installmentOption === "3") {
      speechText += ` y el precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, el cual puedes fraccionar en tres (03) cuotas sin intereses`;
    }
  }
  
  speechText += `.<br><br>`;
  
  if (servicioTv) {
    if (servicioTv.includes("WINTV")) {
      speechText += `También, comentarte que el servicio de televisión digital que brinda WIN incluye únicamente acceso a <strong class="bold-keyword">WINTV</strong>.<br>`;
    } else if (servicioTv.includes("DGO")) {
      speechText += `También, comentarte que el servicio de televisión digital que brinda WIN incluye únicamente acceso a <strong class="bold-keyword">DGO</strong>.<br>`;
    }
  }
  
  speechText += `<br>¿Es correcto?<br><strong class="bold-keyword">(CLIENTE RESPONDE).</strong><br><br>Ahora procederé con la lectura de contrato.`;
  
  return speechText;
}

/***************************************
 * GENERAR CONTRATO
 ***************************************/
function updateContract() {
  const emptyState = document.getElementById('emptyState');
  const contractWrapper = document.getElementById('contractWrapper');
  
  if (!state.fiberSpeed) {
    emptyState.classList.remove('hidden');
    contractWrapper.classList.add('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  contractWrapper.classList.remove('hidden');
  
  moment.locale("es");
  const currentDate = moment();
  const plan = config.pricing[state.location][state.fiberSpeed];
  
  let summaryText = `${state.location.toUpperCase()} - ${state.documentType === "ruc" ? "RUC 20" : "DNI/CE/RUC 10"} - ${getSelectSpeedText(state.fiberSpeed, state.location)}`;
  
  if (state.documentType === "ruc") {
    summaryText += ` - Instalación ${state.installment} ${state.installment === "1" ? "cuota" : "cuotas"}`;
  }
  
  let svaParts = [];
  Object.keys(state.sva).forEach(category => {
    if (state.sva[category].length > 0) {
      const labels = state.sva[category].map(key => svaConstants[category][key].label);
      svaParts.push(labels.join(" / "));
    }
  });
  if (svaParts.length > 0) {
    summaryText += " + " + svaParts.join(" + ");
  }
  
  document.getElementById("planSummary").innerHTML = summaryText;
  
  let datosText = "";
  if (state.documentType === "ruc") {
    datosText = `<p>
        Nombre de la empresa (Razón social)<br>
        Datos del representante legal (Nombre completo, DNI)<br>
        Número de RUC (20…)<br>
        Correo electrónico para el envío de recibos<br>
        Su número de contacto<br>
        Dirección en la que se instalará el servicio
    </p>`;
  } else {
    datosText = `<p>
      Su nombre completo es<br>
      Su número de documento de identidad / CE / RUC (10…)<br>
      <div style="display: flex; align-items: center; margin: 4px 0;">
        <span style="margin-right: 8px;">Lugar y Fecha de Nacimiento</span>
        <input type="text" id="ubigeoInput" placeholder="Ubigeo" oninput="updateUbigeoDisplay()" style="width: 120px; padding: 4px; border: 1px solid #ccc; border-radius: 4px;" value="${currentUbigeoValue}">
        <span id="ubigeoDisplay" style="margin-left: 4px; font-size: 0.875rem; color: #4a5568;">${ubigeoDisplayText}</span>
      </div>
      Correo electrónico para el envío de recibos<br>
      Su número telefónico es<br>
      Dirección en la que se instalará el servicio
    </p>`;
  }
  
  let pricingText = "";
  if (state.documentType === "ruc") {
    pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
  } else {
    if (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50") {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.<br><br>Por promoción, el primer <strong class="bold-keyword"><span style="font-size:1.2em;">01 mes</span></strong>, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb_promo}</span></strong> (incluye I.G.V.); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else if (plan.tipo === "promo_condominio") {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.<br><br>Por promoción, los dos primeros <strong class="bold-keyword"><span style="font-size:1.2em;">02 meses</span></strong>, pagarás a un precio promocional de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ 1</span></strong> (incluye I.G.V.); vencidos estos plazos, se aplicarán las condiciones regulares de tu plan contratado.`;
    } else {
      pricingText = `El precio mensual es de <strong class="bold-keyword"><span style="font-size:1.2em;">S/ ${plan.pb}</span></strong> incluye I.G.V.`;
    }
  }
  
  let installationText = "";
  if (state.documentType === "ruc") {
    if (state.installment === "1") {
      installationText = `<p>El precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, con un precio promocional de <strong class="bold-keyword">S/ 60.00</strong>.</p>`;
    } else if (state.installment === "3") {
      installationText = `<p>El precio de instalación es de <strong class="bold-keyword">S/ 120.00</strong> incluido IGV, el cual puedes fraccionar en tres (03) cuotas sin intereses.</p>`;
    }
  }
  
  const tvSVA = state.sva.tv;
  const meshSVA = state.sva.mesh;
  const winboxSVA = state.sva.winbox;
  
  let reconnectionSection = `
    <div class="contract-section">
      <p>La tarifa de reconexión es de <strong class="bold-keyword">S/ 6.01</strong>, incluye I.G.V.</p>
  `;
  
  if (state.sva.fono.length > 0) {
    const option = state.sva.fono[0];
    const { label, description } = getSVALabelAndDescription(option, state.documentType);
    reconnectionSection += `
      <div class="mt-3">
        <h3 class="font-bold text-base">FIJO</h3>
        <p class="text-gray-900">${description}</p>
      </div>
    `;
  }
  reconnectionSection += `</div>`;
  
  let svaOrderedSections = "";
  
  if (tvSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    tvSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, state.documentType);
      let finalDescription = description;
      if (state.documentType !== "ruc" && (plan.tipo === "descuento50" || plan.tipo === "gamer_descuento50")) {
        finalDescription = description.replace(
          /El precio mensual de la suscripción es de <strong class="bold-keyword">S\/ ([0-9.]+)<\/strong> incluido IGV\./g,
          (match, price) => {
            const discountedPrice = (parseFloat(price) * 0.5).toFixed(2);
            return `El precio mensual de la suscripción es de <strong class="bold-keyword">S/ ${price}</strong> incluido IGV.<br><br>Por promoción, el primer <strong class="bold-keyword">01 mes</strong>, pagarás a un precio promocional de <strong class="bold-keyword">S/ ${discountedPrice}</strong> (incluye I.G.V.); vencido este plazo, se aplicarán las condiciones regulares de tu plan contratado.`;
          }
        );
      }
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${finalDescription}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }
  
  if (meshSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    meshSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, state.documentType);
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${description}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }
  
  if (winboxSVA.length > 0) {
    svaOrderedSections += `<div class="contract-section"><div class="mt-3 border-t pt-3">`;
    winboxSVA.forEach((sva) => {
      const { label, description } = getSVALabelAndDescription(sva, state.documentType);
      svaOrderedSections += `<h3 class="text-lg font-bold mt-2">${label}</h3><p class="mt-1">${description}</p>`;
    });
    svaOrderedSections += `</div></div>`;
  }
  
  let contractHTML = `
    <div class="fade-in">
      <div class="contract-section speech-section">
        <p class="font-bold text-base mb-2">SPEECH:</p>
        <p>${generateSpeech(plan, state.fiberSpeed, state.documentType, state.sva, state.installment)}</p>
      </div>
      
      <p class="text-sm">
        Hoy ${currentDate.format("DD")} de ${currentDate.format("MMMM")} del ${currentDate.format("YYYY")}, en la ciudad de LIMA, usted contrata con WIN, para ello me brinda los siguientes datos:
      </p>
      ${datosText}
      
      <div class="contract-section">
        <h3 class="font-bold text-base">FIBRA</h3>
        <p>
          El servicio de internet fijo postpago de WIN es ilimitado, 100% fibra óptica, con velocidad simétrica de <strong class="bold-keyword"><span style="font-size:1.2em;">${getDisplaySpeed(state.fiberSpeed)} Mbps</span></strong> de carga y descarga, con un mínimo garantizado de <strong class="bold-keyword"><span style="font-size:1.2em;">${plan.vm} Mbps</span></strong> de carga y descarga, incluye un equipo terminal router y conector en comodato, el cual deberá devolver en buenas condiciones; caso contrario, pagarás su valor. El contrato tendrá plazo indeterminado y podrá ser resuelto de acuerdo a la normativa de condiciones de uso.
        </p>
        <br>
        <p>${pricingText}</p>
      </div>
      
      ${state.documentType === "ruc" ? installationText : ""}
      
      ${reconnectionSection}
      
      <div class="contract-section">
        <p>
          La fecha de facturación es el <strong class="bold-keyword">14</strong> de cada mes, y la fecha de vencimiento es el <strong class="bold-keyword">28</strong> del mismo mes.
        </p>
        <br>
        <p>
          Le agradeceré que diga fuerte y claramente que <strong class="bold-keyword">SÍ ACEPTA</strong> los términos de la presente contratación. <strong class="bold-keyword">CLIENTE RESPONDE SI</strong>.
        </p>
        <br>
        <p>
          WIN realizará el tratamiento de datos personales para gestiones relacionadas con el servicio, se almacenarán tus datos en nuestro Banco de Datos de clientes de acuerdo a la normativa vigente. Podrás ejercer tus derechos ARCO escribiendo al correo protecciondedatos@win.pe. Para más información visita win.pe/protección-de-datos.
        </p>
        <br>
        <p>
          ¿Declaras conocer la Política de Privacidad y autorizas de forma previa, expresa, informada e inequívoca el tratamiento de datos personales? <strong class="bold-keyword">CLIENTE RESPONDE SI</strong>.
        </p>
        <br>
        <p>
          ¿Aceptas el envío de comunicaciones comerciales, publicitarias y encuestas? <strong class="bold-keyword">CLIENTE RESPONDE SI/NO</strong>.
        </p>
      </div>
      
      ${svaOrderedSections}
      
      <div class="contract-section">
        <p class="mt-3 text-center font-bold text-blue-600">BIENVENIDO A LA FAMILIA WIN.</p>
      </div>
    </div>
  `;
  
  document.getElementById("contractContent").innerHTML = contractHTML;
}

/***************************************
 * INICIALIZACIÓN
 ***************************************/
document.addEventListener("DOMContentLoaded", function() {
  renderFiberPlans();
  updateSvaChips();
  updateContract();
  
  // Botones de ubicación
  document.querySelectorAll('[data-location]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-location]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.location = this.getAttribute('data-location');
      state.fiberSpeed = null;
      state.sva = { fono: [], tv: [], mesh: [], winbox: [] };
      renderFiberPlans();
      updateSvaChips();
      updateContract();
    });
  });
  
  // Botones de tipo de documento
  document.querySelectorAll('[data-doctype]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-doctype]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.documentType = this.getAttribute('data-doctype');
      
      const installmentSection = document.getElementById('installmentSection');
      if (state.documentType === "ruc") {
        installmentSection.classList.remove('hidden');
      } else {
        installmentSection.classList.add('hidden');
      }
      
      state.fiberSpeed = null;
      state.sva = { fono: [], tv: [], mesh: [], winbox: [] };
      renderFiberPlans();
      updateSvaChips();
      updateContract();
    });
  });
  
  // Botones de instalación
  document.querySelectorAll('[data-installment]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-installment]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.installment = this.getAttribute('data-installment');
      updateContract();
    });
  });
  
  // Chips de SVA
  document.querySelectorAll('.chip-sva').forEach(chip => {
    chip.addEventListener('click', function() {
      const service = this.getAttribute('data-service');
      const key = this.getAttribute('data-key');
      
      if (service === 'tv' && key) {
        if (state.sva.tv.includes(key)) {
          state.sva.tv = [];
        } else {
          state.sva.tv = [key];
        }
        updateSvaChips();
        updateContract();
      } else if (service === 'fono' || service === 'mesh' || service === 'winbox') {
        openSvaModal(service);
      }
    });
  });
  
  // Modal SVA
  document.getElementById('btnCloseModal').addEventListener('click', () => closeSvaModal(false));
  document.getElementById('btnCancel').addEventListener('click', () => closeSvaModal(false));
  document.getElementById('btnSave').addEventListener('click', () => closeSvaModal(true));
  
  // Planes frecuentes
  document.querySelectorAll('.btn-frequent').forEach(btn => {
    btn.addEventListener('click', function() {
      const fiber = parseFloat(this.getAttribute('data-fiber'));
      const svaData = JSON.parse(this.getAttribute('data-sva'));
      
      state.fiberSpeed = fiber;
      state.sva = { fono: [], tv: [], mesh: [], winbox: [] };
      
      svaData.forEach(optionKey => {
        for (const category in svaConstants) {
          if (svaConstants[category][optionKey]) {
            state.sva[category].push(optionKey);
            break;
          }
        }
      });
      
      renderFiberPlans();
      updateSvaChips();
      updateContract();
    });
  });
});
