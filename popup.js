(async function getData() {
  let infoData = {};

  const body = document.body;
  const content = body.querySelector(".ui-content"); // data-role="content"
  const header = content.querySelector(".txtCenter");
  const nomeEmpresa = header.querySelector(".txtTopo").innerText.trim();
  const cnpj = header.querySelector(".text").innerText.trim().replace(/\s+/g, '').replace('CNPJ:', '');
  const endereco = header.querySelectorAll(".text")[1].innerText.trim();
  const [logradouro, numero, complemento, bairro, cidade, estado] = endereco.split(',').map(item => item.trim());
  const table = content.querySelector("#tabResult");
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const totalNotaDiv = content.querySelector("#totalNota");

  const infosDiv = document.getElementById("infos");
  const divs = infosDiv.querySelectorAll("div[data-role='collapsible']");

  divs.forEach(div => {
    let heading = div.querySelector(".ui-collapsible-heading-toggle").innerText.trim();
    const content = div.querySelector(".ui-collapsible-content");
    const innerText = content.querySelector("li").innerText.trim();
    heading = heading.split('\n')[0].trim().toLowerCase();
    if (heading.includes("gerais da nota")) {
      const decodedInnerText = innerText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const numero = decodedInnerText.match(/Numero: (\d+)/)[1];
      const serie = decodedInnerText.match(/Serie: (\d+)/)[1];
      const emissao = decodedInnerText.match(/Emissao: (.*?) -/)[1];
      infoData["numero"] = numero;
      infoData["serie"] = serie;
      infoData["emissao"] = emissao;
    }

    if (heading.includes("chave de acesso")) {
      const chaveAcesso = content.querySelector(".chave").innerText.trim().replace(/\s+/g, '');
      infoData["chave_acesso"] = chaveAcesso;
    }

    if (heading.includes("consumidor")) {
      infoData["consumidor"] = innerText;
    }

    if (heading.includes("de interesse do contribuinte")) {
      infoData["interesses_contribuinte"] = innerText;
    }
  });

  let results = {};
  Array.from(totalNotaDiv.querySelectorAll('div #linhaTotal')).forEach((item) => {
    let key = item.querySelector('label').innerText.trim().toLocaleLowerCase().replace('r$:', '');

    if (key.includes('tributos')) {
      key = 'tributos';
    }

    if (key !== "" && key !== " ") {
      key = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[\W_]+/g, ' ') // Substitui caracteres não alfabéticos e underscore por espaços
        .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
        .replace(/ (.)/g, (_, char) => char.toUpperCase()) // Converte para camelCase
        .replace(/ /g, ''); // Remove espaços
      let value = item.querySelector('.totalNumb').innerText;
      infoData = Object.assign({}, infoData, { [key]: value });
    }
  });

  infoData = Object.assign({}, infoData, {
    nome_empresa: nomeEmpresa,
    cnpj: cnpj,
    endereco: {
      logradouro: logradouro,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      cidade: cidade,
      estado: estado
    },
    items: []
  });

  infoData.items = rows.map(row => {
    const rowData = {};

    const id = row.id;
    rowData["id"] = id;

    const firstCell = row.querySelector("td:first-child");
    rowData["nome"] = firstCell.querySelector(".txtTit").innerText.trim();
    rowData["codigo"] = firstCell.querySelector(".RCod").innerText.trim().replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ').replace('Código:', '').trim();
    rowData["quantidade"] = parseInt(firstCell.querySelector(".Rqtd strong").nextSibling.textContent.trim());
    rowData["unidade"] = firstCell.querySelector(".RUN strong").nextSibling.textContent.trim();
    rowData["valor_unitario"] = parseFloat(firstCell.querySelector(".RvlUnit strong").nextSibling.textContent.trim().replace(',', '.'));

    const secondCell = row.querySelector("td:nth-child(2)");
    rowData["valor_total"] = parseFloat(secondCell.querySelector(".valor").innerText.trim().replace(',', '.'));

    return rowData;
  });

  if (Object.keys(infoData).length > 0) {
    var json = JSON.stringify(infoData);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    if (body.querySelector(".download-button")) {
      body.querySelector(".download-button").remove();
    }
    let divButtons = document.createElement("div");

    divButtons.innerHTML = `
    <div id="body_borda" class="borda-op download-button">
        <button id="body_btnDownloadJson" class="botao-padrao cinza ui-btn ui-shadow ui-corner-all"><i class="fa fa-file-code-o"></i>
          <a href="${url}" download="nfe_${infoData.nome_empresa.replace(/ /g, "_")}_${infoData.emissao}.json">
            Donwload JSON
          </a>
        </button>
    </div>
    `;

    let divActions = body.querySelector("#body_borda");
    divActions.after(divButtons);

  }
})();
