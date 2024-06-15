const puppeteer = require('puppeteer');

async function scrape() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Configura o cabeçalho para simular uma solicitação de navegador
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0'
  });

  let currentPage = 1;
  const maxPages = 10; // Defina o número máximo de páginas a serem visitadas

  const baseUrl = 'https://www.netimoveis.com/venda/espirito-santo/guarapari?transacao=venda&localizacao=BR-ES-guarapari---&';

  while (currentPage <= maxPages) {
    const pageUrl = `${baseUrl}&pagina=${currentPage}`;
    
    // Navega até a página desejada
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });

    // Espera até que a página esteja completamente carregada
    await page.waitForSelector('body');

    // Obtém os elementos desejados
    const data = await page.evaluate(() => {
      // Função para selecionar o texto ou retornar 'N/A' se não encontrar o elemento
      const getText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : 'N/A';
      };

      // Seleciona todos os contêineres de imóveis
      const elements = [...document.querySelectorAll('div.card-imovel')];
      const results = elements.map(element => {
        const nome = getText('div.mb-2.tipo', element);
        const endereco = getText('div.endereco', element);
        const area = getText('div.caracteristica.area', element);
        const quarto = getText('div.caracteristica.quartos', element);
        const vaga = getText('div.caracteristica.vagas', element);
        const banheiro = getText('div.caracteristica.banheiros', element);
        const preco = getText('div.valor', element);

        return { 
          nome, 
          endereco, 
          area, 
          quarto, 
          vaga, 
          banheiro, 
          preco 
        };
      });
      return results;
    });

    // Imprime os dados encontrados
    if (data.length > 0) {
      console.log(`Dados encontrados na página ${currentPage}:`, data);
    } else {
      console.log(`Nenhum dado encontrado na página ${currentPage}.`);
    }

    // Imprime a URL atual
    console.log(`URL da página ${currentPage}: ${pageUrl}`);

    // Aguarda totalmente o carregamento da próxima página
    try {
      // Verifica se o botão "Próxima página" está disponível
      const nextPageButton = await page.$('li.page-item-next, li[class*="next"]');
      if (nextPageButton) {
        // Clica no botão "Próxima página"
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          nextPageButton.click()
        ]);
      } else {
        console.log('Botão "Próxima página" não encontrado. Encerrando raspagem.');
        break;
      }

    } catch (error) {
      console.error('Erro ao navegar para a próxima página:', error);
      break; // Sai do loop se ocorrer um erro ao navegar
    }

    currentPage++;
  }

  // Fecha o navegador
  await browser.close();
}

// Chama a função para iniciar a raspagem
scrape();
