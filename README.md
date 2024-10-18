# Automação de Consulta de Débitos

Este projeto utiliza o Puppeteer para automatizar o processo de login e consulta de débitos em um site específico. O script lê as credenciais de um arquivo de configuração no formato `.ini`.

## Pré-requisitos

Antes de executar o projeto, verifique se você possui as seguintes dependências instaladas:

- [Node.js](https://nodejs.org/) (versão 12 ou superior)
- [Puppeteer](https://pptr.dev/)
- [ini](https://www.npmjs.com/package/ini)

## Instalação

1. Clone o repositório ou baixe os arquivos do projeto.
2. Navegue até o diretório do projeto no terminal.
3. Instale as dependências necessárias usando o npm:

   ```bash
   npm install puppeteer ini

Crie um arquivo config.ini no mesmo diretório do seu script com o seguinte formato:

# Configuração do Arquivo `config.ini`
## Estrutura do Arquivo

```ini
[credenciais]
login = seu_login
senha = sua_senha

[diretorio]
instalacao = sua_instalacao
path = caminho_para_download

## Uso
Para executar o script, utilize o seguinte comando no terminal:

bash
node app.js