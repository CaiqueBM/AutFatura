import subprocess
from datetime import datetime
# Abra o arquivo que contém os parâmetros
with open('instalacoes_ult.csv', 'r') as file:
    # Ler o arquivo linha por linha
    next(file) #pula a primeira que é cabeçalho.
    hoje = datetime.now().strftime('%d/%m/%Y')
    for line in file:
        # Remover espaços extras e quebras de linha
        params = line.strip().split(',')
        # Verifica a data
        if params[2] != hoje:
            continue  # Pular esta linha se a data não for igual à data atual
        # Contadores
        attempts = 0
        max_attempts = 5
        success = False
        while attempts < max_attempts:
            # Chamar o script Node.js e passar os parâmetros
            result = subprocess.run(['node', 'app.js', *params], capture_output=True, text=True)
            if 'OK' in result.stdout:
                success = True
                #quebra o loop e bora pro próximo.
                break
            else:
                attempts += 1

