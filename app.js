const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');
const path = require('path'); 
const fs = require('fs');
const ini = require('ini');

// Ler e parsear o arquivo .ini
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// Informações de config
const login = config.credenciais.login;
const senha = config.credenciais.senha;
// const instalacao = config.diretorio.instalacao;
const arquivo = process.argv[2]


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

puppeteerExtra.use(Stealth());
const randomUseragent = require('random-useragent');

(async () => {
    let browser, context, page;

    try {
      const maxRetries = 5; // Número máximo de tentativas de login
      let success = false;
      let attempts = 3;
      while (!success && attempts < maxRetries) 
      {
        // Inicializa o browser e abre uma nova página
        //Variaveis definidas fora do bloco try catch para evitar problemas a frente no codigo.
        browser = await puppeteerExtra.launch({ 
          headless: false,
          args: ['--incognito', '--window-size=1980,1080'] // Define o tamanho da janela
          }); 
        // Cria um contexto anônimo (modo incognito)
        context = browser.defaultBrowserContext();
        // Abre uma nova página no contexto anônimo
        page = await browser.newPage()
        try {

              
              page.setDefaultNavigationTimeout(60000);

              // Define o tamanho da viewport para simular uma janela de desktop.
              // Importante para evitar empilhamento dos menus.
              await page.setViewport({ 
                width: 1980,
                height: 1080,
                }
                );
              await page.setUserAgent(
                randomUseragent.getRandom() || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
              );
              await page.evaluateOnNewDocument(() => {
                  // Pass webdriver check
                  Object.defineProperty(navigator, 'webdriver', {
                      get: () => false,
                  });
              });

              await page.evaluateOnNewDocument(() => {
                // Pass chrome check
                window.chrome = {
                    runtime: {}, // Simula o objeto runtime (usado por extensões)
                    // Adiciona webstore para simular a presença do Chrome Web Store
                    webstore: {
                        onInstallStageChanged: {},
                        onDownloadProgress: {},
                    },
            
                    // Adiciona loadTimes para simular o método loadTimes, usado em algumas verificações
                    loadTimes: () => ({
                        requestTime: 1234567890,
                        startLoadTime: 1234567890,
                        commitLoadTime: 1234567890,
                        finishDocumentLoadTime: 1234567890,
                        finishLoadTime: 1234567890,
                        firstPaintTime: 1234567890,
                        firstPaintAfterLoadTime: 1234567890,
                        navigationType: 'reload',
                        wasFetchedViaSpdy: false,
                        wasNpnNegotiated: false,
                        npnNegotiatedProtocol: '',
                        wasAlternateProtocolAvailable: false,
                        connectionInfo: 'http/1.1',
                    })
                };
              });

              await page.evaluateOnNewDocument(() => {
                //Pass notifications check
                const originalQuery = window.navigator.permissions.query;
                return window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
              });
        
              await page.evaluateOnNewDocument(() => {
                // Overwrite the `plugins` property to use a custom getter.
                Object.defineProperty(navigator, 'plugins', {
                    // This just needs to have `length > 0` for the current test,
                    // but we could mock the plugins too if necessary.
                    get: () => [1, 2, 3, 4, 5],
                });
              });
        
              await page.evaluateOnNewDocument(() => {
                // Overwrite the `languages` property to use a custom getter.
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['pt-BR', 'pt'],
                });
              });

        /*

          BROWSER JÁ CONFIGURADO

        */
              console.log(`Tentativa de login ${attempts + 1}`);
      
              // Navega até a página
              await page.goto('https://www.edponline.com.br/engenheiro', {waitUntil: 'networkidle2'});
      
              await acceptCookies(page); // Aceita os cookies
      
              
              // Adiciona Login
              const loginSelector = '#Email';
              await page.locator(loginSelector).setWaitForEnabled(true).setTimeout(20000);
              await page.focus(loginSelector);
              await page.type(loginSelector, login);
              
              // Adiciona Senha
              const passwordSelector = '#Senha';
              await page.locator(passwordSelector).setWaitForEnabled(true).setTimeout(20000);
              await page.focus(passwordSelector);
              await page.type(passwordSelector, senha);
              
              // await page.locator('.login__overlay').click(); //Necessário para ativar o botao.
              
              await delay(1200 + Math.floor(Math.random() * 100)); // Atraso para corrigir o bug do site
              // Seleciona o botão 'ES'
              await page.evaluate(() => {
                let radio = document.querySelector('#option-1');
                radio.click();
                radio.click();
              });
              // Clica no botão Entrar e espera a navegacao
              await page.locator('button ::-p-text(Entrar)').setTimeout(10000).hover();
              await Promise.all([
                  page.locator('button ::-p-text(Entrar)').setWaitForEnabled(true).setTimeout(10000).click(),
                  page.waitForNavigation({waitUntil: 'networkidle2', timeout: 15000})
              ]);
              // Verifica se o seletor de sucesso está presente
              // await page.waitForSelector('.site-header__logo', {visible: true, timeout: 15000});
              await page.locator('#acesso-rapido').setWaitForEnabled(true).setTimeout(5000).hover();
              success = true; // Define sucesso como verdadeiro se o seletor for encontrado
              console.log(`[${getFormattedDate()}] Login realizado com sucesso.`);
        
            } catch (error) {
                console.error(`[${getFormattedDate()}] Erro na tentativa ${attempts + 1}:`, error);
                attempts++;
                if (attempts >= maxRetries) {
                    console.error(`[${getFormattedDate()}] Falha no login após várias tentativas.`);
                } else {
                    console.log(`[${getFormattedDate()}] Reiniciando tentativa de login...`);
                    await browser.close();
                }
            }
      }
      
      if (!success) 
      {
          throw new Error(`[${getFormattedDate()}] Falha ao realizar login após múltiplas tentativas.`);
      }
        /*
        --------------LOGIN JÁ FEITO--------------------
        */
       await loadCSV(arquivo); //cARREGA AS INSTALAÇÕES
       updatePaths(rows); //Coloca os devidos paths para receber os dados.
       //Inicia FOR
       for (const row of rows) 
        {
          let attempts = 2; // Reseta tentativas para cada linha
          const instalacao = row.instalacao; // Parâmetro de instalacao a ser utilizado
          
          while (attempts < maxRetries) 
            {
              try {
                    console.log(`[${getFormattedDate()}] Tentativa de processar a instalacao: ${instalacao} (Tentativa ${attempts + 1})`);
                    
                    await Promise.all([
                      page.goto('https://www.edponline.com.br/servicos/consulta-debitos'),
                      page.waitForNavigation({waitUntil: 'networkidle2'})
                    ]);
                    // Adicionar instalacao
                    const instalacaoSelector = '#Instalacao'; // Seletor correto do campo de instalacao
                    await page.waitForSelector(instalacaoSelector);
                    await page.type(instalacaoSelector, instalacao);
        
                    // Aguardo carregar e clicar em "Avançar"
                    await Promise.all([
                        page.locator('button ::-p-text(Avançar)').setTimeout(10000).hover(),
                        page.locator('button ::-p-text(Avançar)').setTimeout(10000).click(),
                        page.waitForNavigation({ waitUntil: 'networkidle0' })
                    ]);
        
                    await Promise.all([
                        page.click('.instalacao'),
                        page.waitForNavigation({ waitUntil: 'networkidle0' })
                    ]);
        
                    // Etapa de download
                    await ensureDirectoryExists(String(row.path)); // Verifica se existe e cria o diretório caso não exista
                    await page.locator('div ::-p-text(Visualizar)').setTimeout(3000).click();
        
                    const client = await page.target().createCDPSession();
                    await client.send('Page.setDownloadBehavior', {
                        behavior: 'allow',
                        downloadPath: path.resolve(String(row.path))
                    });
        
                    await page.locator('div ::-p-text(Baixar)').setTimeout(45000).click();
                    await waitUntilDownload(page); // Aguarda o download completar
        
                    // Sai da instalacao
                    await Promise.all([
                        page.goto('https://www.edponline.com.br/servicos/sair-instalacao'),
                        page.waitForNavigation({ waitUntil: 'networkidle2' })
                    ]);
        
                    console.log(`[${getFormattedDate()}] Processamento bem-sucedido para a instalacao: ${instalacao}.`);
                    break; // Sai do loop se o processamento for bem-sucedido
        
                } catch (error) {
                    console.error(`Erro ao processar a instalacao: ${row.instalacao} (Tentativa ${attempts + 1}):`, error);
                    attempts++;
                    // Sai da instalacao
                    await Promise.all([
                      page.goto('https://www.edponline.com.br/servicos/sair-instalacao'),
                      page.waitForNavigation({ waitUntil: 'networkidle2' })
                    ]);
                    if (attempts >= maxRetries) {
                        console.error(`[${getFormattedDate()}] Falha no processamento da instalacao: ${instalacao} após várias tentativas.`);
                        await Promise.all([
                          page.goto('https://www.edponline.com.br/servicos/sair-instalacao'),
                          page.waitForNavigation({ waitUntil: 'networkidle2' })
                        ]);
                    } else {
                        console.log(`[${getFormattedDate()}] Reiniciando tentativa de processamento...`);
                        await Promise.all([
                          page.goto('https://www.edponline.com.br/servicos/sair-instalacao'),
                          page.waitForNavigation({ waitUntil: 'networkidle2' })
                        ]);
                    }
                }
            }
        
            if (attempts >= maxRetries) 
            {
                // throw new Error(`[${getFormattedDate()}] Falha ao processar a instalacao ${instalacao} após múltiplas tentativas.`);
                console.log(`[${getFormattedDate()}] Falha ao processar a instalacao ${instalacao} após máximo de tentativas. ${attempts} > ${maxRetries}`);
            }
        }
        await browser.close();
        console.log('Processo encerrado com sucesso');
        
      } catch (error)
      {
        console.log('FAIL');
      }
})();

const csv = require('csv-parser');

let rows = []; // Array para armazenar todas as linhas do CSV

// Funcao para carregar o CSV e armazenar as linhas
function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row); // Armazena cada linha no array rows
      })
      .on('end', () => {
        resolve(); // Resolver quando terminar de ler o arquivo
      })
      .on('error', (err) => reject(err)); // Rejeitar em caso de erro
  });
}

function getFormattedDate() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19); // Formato: 'YYYY-MM-DD HH:mm:ss'
}

//Funçao que coloca os paths de ano e mês dentro do caminho dos rows.
function updatePaths(rows) {
  const currentYear = new Date().getFullYear();
  const currentMonth = getMonthName(new Date().getMonth());

  rows.forEach(row => {
      console.log('processando Row:', row);
    if (row.path) {
      row.path = path.join(row.path, currentYear.toString(), currentMonth, path.sep); //Necessário adicionar um arquivo ficticio para a proxima função dirname.
      
    }
    else { console.log(row.path)}
  });
}

// Função para obter o mês por extenso em português
function getMonthName(month) {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[month];
}
