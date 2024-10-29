import subprocess
from datetime import datetime
import os
import locale

# Definir a localidade para português do Brasil
locale.setlocale(locale.LC_TIME, 'pt_BR.utf8')
# Abra o arquivo que contém os parâmetros
with open('instalacoes_ult.csv', 'r') as file:
    # Ler o arquivo linha por linha
    next(file) #pula a primeira que é cabeçalho.
    hoje = datetime.now().day #pega o dia de hoje.
    for line in file:
        # Remover espaços extras e quebras de linha
        params = line.strip().split(',')
        # Verifica a data
        # if params[2] != hoje:
        if hoje != int(params[2].split('/')[0]):
            hoje = hoje #Faz nada para testes.
            # continue  # Pular esta linha se a data não for igual à data atual
        # Contadores
        attempts = 0
        max_attempts = 5
        success = False
        #Ajuste do caminho para facilitar
        params[1] = os.path.join(params[1], datetime.now().strftime('%Y'), datetime.now().strftime('%B').capitalize())
        while attempts < max_attempts:
            # Chamar o script Node.js e passar os parâmetros, com timeout de dois minutos.
            try:
                result = subprocess.run(['node', 'app.js', *params], capture_output=True, text=True, timeout=100)
                
                if 'OK' in result.stdout:
                    success = True
                    #quebra o loop e bora pro próximo.
                    break
                else:
                    attempts += 1
            except subprocess.TimeoutExpired:
                attempts += 1

