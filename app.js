const puppeteer = require('puppeteer');
const path = require('path'); 
const fs = require('fs');
const ini = require('ini');

// Ler e parsear o arquivo .ini
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// Informações de config
const login = config.credenciais.login;
const senha = config.credenciais.senha;
const instalacao = config.diretorio.instalacao;
const pathdownload = config.diretorio.path;

async function acceptCookies(p) {
  const cookieButtonSelector = '#onetrust-accept-btn-handler';
  
  try {
    // Espera pelo botão de aceitar cookies
    await p.waitForSelector(cookieButtonSelector, { timeout: 1000 }); // Aguardar até 5 segundos
    await p.click(cookieButtonSelector);
  } catch (error) {
    // Se o botão não for encontrado, não faz nada
  }
}

(async () => {
  // Inicializa o browser e abre uma nova página
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--incognito','--window-size=1400,1000'] // Define o tamanho da janela
    }); // `headless: false` para visualizar a automação

  // Cria um contexto anônimo (modo incognito)
  const context = browser.defaultBrowserContext();
  
  // Abre uma nova página no contexto anônimo
  const page = (await context.pages())[0]
  page.setDefaultNavigationTimeout(50000)

  // Define o tamanho da viewport para simular uma janela de desktop
  await page.setViewport({ width: 1400, height: 1000 });
 
  // Navega até a página
  await page.goto('https://www.edponline.com.br/engenheiro');

  await acceptCookies(page);

  // Espera o botão estar disponível e clica
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
  await page.waitForSelector(passwordSelector);
  await page.type(passwordSelector, senha);

  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  await acceptCookies(page);

  await Promise.all([
    page.goto('https://www.edponline.com.br/servicos/consulta-debitos'),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);
  //await acceptCookies(page);

  // Adicionar instalacao
  const instalacaoSelector = '#Instalacao'; // Seletor correto do campo de login
  await page.waitForSelector(instalacaoSelector);
  await page.type(instalacaoSelector, instalacao);
  //Aguardo carregar.
  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);
  await acceptCookies(page)
  await Promise.all([
    page.click('.instalacao'),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);


  await page.locator('div ::-p-text(Visualizar)').setTimeout(3000).click();
  
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: path.resolve(pathdownload)
  });
    
  await page.locator('div ::-p-text(Baixar)').setTimeout(10000).click();
  // Fecha o browser
  await browser.close();
})();
