const puppeteer = require('puppeteer');

async function scrape() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Configura o cabeçalho para simular uma solicitação de navegador
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0'
  });

  let pageNumber = 1; // Variável para controlar o número da página
  let allProperties = [];  // Array para armazenar todos os dados coletados

  while (true) {
    // Constrói o URL da página atual com base no número da página
    const url = `https://www.netimoveis.com/venda/espirito-santo/guarapari?cmp=211&nr=GA-vitoria-venda&gad_source=1&gclid=CjwKCAjw1K-zBhBIEiwAWeCOF_rbB2Kn1yIC4iDqHA5WgLTW8mJCbcopF4aHauM6rYBwVokHf0lVhxoCygkQAvD_BwE&transacao=venda&localizacao=BR-ES-guarapari---&pagina=${pageNumber}`;

    // Navega até a página desejada
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

    // Espera até que a página esteja completamente carregada
    await page.waitForSelector('body');

    // Rola a página para baixo para carregar todos os elementos
    await autoScroll(page);

    // Obtém todos os elementos que contêm as informações desejadas
    const properties = await page.evaluate(() => {
      const neighborhoodElements = [...document.querySelectorAll('div.endereco')];
      const areaElements = [...document.querySelectorAll('div.caracteristica.area')];
      const roomElements = [...document.querySelectorAll('div.caracteristica.quartos')];
      const garageElements = [...document.querySelectorAll('div.caracteristica.vagas')];
      const bathroomElements = [...document.querySelectorAll('div.caracteristica.banheiros')];
      const priceElements = [...document.querySelectorAll('div.valor')];

      // Extrai e retorna o texto dos elementos, organizando por propriedade
      return neighborhoodElements.map((element, index) => ({
        neighborhood: element.textContent.trim(),
        area: areaElements[index] ? areaElements[index].textContent.trim() : 'N/A',
        rooms: roomElements[index] ? roomElements[index].textContent.trim() : 'N/A',
        garages: garageElements[index] ? garageElements[index].textContent.trim() : 'N/A',
        bathrooms: bathroomElements[index] ? bathroomElements[index].textContent.trim() : 'N/A',
        price: priceElements[index] ? priceElements[index].textContent.trim() : 'N/A'
      }));
    });

    // Adiciona os dados coletados à lista total de propriedades
    allProperties = allProperties.concat(properties);

    // Imprime as propriedades encontradas
    console.log(`Coletando dados da página: ${url}`);
    if (properties.length > 0) {
      console.log('Propriedades encontradas:');
      properties.forEach(property => {
        console.log(`Bairro: ${property.neighborhood}, Área: ${property.area}, Quartos: ${property.rooms}, Vagas: ${property.garages}, Banheiros: ${property.bathrooms}, Preço: ${property.price}`);
      });
    } else {
      console.log('Nenhuma propriedade encontrada com as classes especificadas.');
    }

    // Tentar clicar no botão "Próxima página"
    const nextPageButton = await page.$('li.clnext.page-item');
    if (nextPageButton) {
      try {
        await nextPageButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
        
        // Rola a página para baixo para carregar todos os elementos da próxima página
        await autoScroll(page);

        // Aguarda um pequeno intervalo antes de prosseguir para a próxima página
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2 segundos antes de navegar para a próxima página
      } catch (error) {
        console.error('Erro ao tentar navegar para a próxima página:', error);
        break;
      }
    } else {
      console.log('Não há mais páginas para navegar.');
      break; // Sai do loop se o botão "Próxima página" não estiver presente
    }

    // Incrementa o número da página para a próxima iteração
    pageNumber++;

    // Atualiza o número da página no URL para a próxima iteração
    // Você pode adicionar lógica adicional aqui para parar a raspagem se necessário
    // Por exemplo, se o número da página atingir um limite máximo desejado

    // Exemplo: interromper a raspagem após 5 páginas
    if (pageNumber > 5) {
      break;
    }
  }

  // Fecha o navegador
  await browser.close();

  // Imprime o total de propriedades coletadas
  console.log(`Total de propriedades coletadas: ${allProperties.length}`);
}

// Função para rolar a página automaticamente
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Chama a função para iniciar a raspagem
scrape();
