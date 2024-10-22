const puppeteer = require('puppeteer');
const path = require('path'); 
const fs = require('fs');
const ini = require('ini');

// Ler e parsear o arquivo .ini
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// Informações de config
const login = config.credenciais.login;
const senha = config.credenciais.senha;
// const instalacao = config.diretorio.instalacao;
const instalacao = process.argv[2]
const pathdownload = process.argv[3]
// const pathdownload = config.diretorio.path;

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

// Funçao que cria o diretório do path recebido no argv[3]
async function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath); // Extrai o diretório do caminho do arquivo
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // Cria o diretório e subdiretórios se necessário
    console.log(`Diretório criado: ${dir}`);
  }
}

// https://willschenk.com/labnotes/2024/wait_for_the_download_to_finish_with_puppeteer/
async function waitUntilDownload(page, fileName = '') {
  return new Promise((resolve, reject) => {
      page._client().on('Page.downloadProgress', e => { // or 'Browser.downloadProgress'
          if (e.state === 'completed') {
              console.log('OK');
              resolve();
          } else if (e.state === 'canceled') {
              console.log('FAIL');
              reject();
          }
      });
  });
}

async function acceptCookies(page) {
  const cookieButtonSelector = '#onetrust-accept-btn-handler';
  
  try {
    // Espera pelo botão de aceitar cookies
    // await page.waitForSelector(cookieButtonSelector, { timeout: 5000 }); // Aguardar até 5 segundos
    await page.locator(cookieButtonSelector).setTimeout(5000).click();
    await page.click(cookieButtonSelector);
  } catch (error) {
    // Se o botão não for encontrado, não faz nada
  }
}

(async () => {
    try {
        // Inicializa o browser e abre uma nova página
        const browser = await puppeteer.launch({ 
          headless: false,
          args: ['--incognito','--window-size=1380,960'] // Define o tamanho da janela
          }); 

        // Cria um contexto anônimo (modo incognito)
        const context = browser.defaultBrowserContext();
        
        // Abre uma nova página no contexto anônimo
        const page = (await context.pages())[0]
        page.setDefaultNavigationTimeout(50000);

        // Define o tamanho da viewport para simular uma janela de desktop.
        // Importante para evitar empilhamento dos menus.
        await page.setViewport({ width: 1380, height: 960 });

        //Cria um interceptor para descartar as imagens e carregar mais rapido.
        await page.setRequestInterception(true);
        page.on('request', (request) => 
          {
            if (request.resourceType() === 'image') 
            {
                request.abort();
            } else
            {
                request.continue();
            }
          });
      
        // Navega até a página
        await page.goto('https://www.edponline.com.br/engenheiro');

        await acceptCookies(page); //Aceita os malditos cookies

        // Espera o botão 'ES' estar disponível e clica
        await page.evaluate(() => {
          let radio = document.querySelector('#option-1');
          radio.click();
        });

        // Adicionar Login
        const loginSelector = '#Email'; // Seletor correto do campo de login
        await page.waitForSelector(loginSelector);
        await page.type(loginSelector, login); 

        // Adicionar Senha
        const passwordSelector = '#Senha'; // Seletor correto do campo de senha
        await page.locator(passwordSelector).setWaitForEnabled(true).setTimeout(10000);
        await page.type(passwordSelector, senha, 100);
        await page.locator('.login__overlay').click();
        //await page.keyboard.press('Tab');
        await delay(500); //Pequeno atraso necessário para bug site EDP.
        //Clica e aguarda carga total.
        await Promise.all([
          page.locator('button ::-p-text(Entrar)').setTimeout(10000).click(),
          page.waitForNavigation({waitUntil: 'networkidle0'})
        ]);

        //Acessa a pagina de interesse e aguarda carregar.
        await Promise.all([
          page.goto('https://www.edponline.com.br/servicos/consulta-debitos'),
          page.waitForNavigation({waitUntil: 'networkidle2'})
        ]);

        // Adicionar instalacao
        const instalacaoSelector = '#Instalacao'; // Seletor correto do campo de login
        await page.waitForSelector(instalacaoSelector);
        await page.type(instalacaoSelector, instalacao);
        //Aguardo carregar.
        await Promise.all([
          page.locator('button ::-p-text(Avançar)').setTimeout(10000).hover(),
          page.locator('button ::-p-text(Avançar)').setTimeout(10000).click(),
          page.waitForNavigation({waitUntil: 'networkidle0'})
        ]);
        await Promise.all([
          page.click('.instalacao'),
          page.waitForNavigation({waitUntil: 'networkidle0'})
        ]);
       
        //Etapa de download.
        await ensureDirectoryExists(pathdownload); //Verifica se existe e cria o diretorio caso nao exista.
        await page.locator('div ::-p-text(Visualizar)').setTimeout(3000).click();
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.resolve(pathdownload)
        });
        await page.locator('div ::-p-text(Baixar)').setTimeout(45000).click();
        await waitUntilDownload(page);
        

        await browser.close();
      } catch (error)
      {
        console.log('FAIL');
      }
})();
