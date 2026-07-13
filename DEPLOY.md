# Guia de Implantação e Deploy - IsLuny Works

Este documento serve como a referência oficial para o processo de implantação (deploy), configuração, atualização e manutenção do **IsLuny Works** em ambiente de produção.

---

## 1. Introdução

O **IsLuny Works** é uma plataforma corporativa desenvolvida para a **IsLuny Org**, cujo principal objetivo é centralizar a gestão de ponto eletrônico, jornada de trabalho, banco de horas e controle analítico de colaboradores. A aplicação foi arquitetada para ser extensível, modular e pronta para receber novos módulos (RH, projetos, tarefas, ativos, documentos, etc.) no futuro.

### Arquitetura e Tecnologias
- **Frontend**: Next.js 15+ (App Router), React, Styled Components, React Hook Form, Zod, TanStack Query, Axios.
- **Backend**: Next.js API Routes (Route Handlers).
- **Banco de Dados & ORM**: PostgreSQL e Prisma ORM.
- **Autenticação**: NextAuth.js (Auth.js) com criptografia bcrypt para senhas.
- **Infraestrutura**: Docker e Docker Compose para isolamento e orquestração de containers.

---

## 2. Requisitos de Sistema

Para executar o IsLuny Works em produção com excelente performance, garanta que o servidor de destino atenda aos seguintes requisitos mínimos:

### Requisitos de Hardware
- **Processador (CPU)**: Mínimo de 1 vCPU (Recomendável: 2 vCPUs ou mais).
- **Memória RAM**: Mínimo de 1.5 GB livres (Recomendável: 2 GB ou mais).
- **Armazenamento**: Mínimo de 10 GB de espaço em disco (SSD altamente recomendado).

### Requisitos de Software
- **Docker Engine**: Versão `24.0.0` ou superior.
- **Docker Compose**: Versão `2.20.0` ou superior.
- **Git**: Versão `2.34.0` ou superior.
- **Reverse Proxy**: Nginx, Traefik ou Nginx Proxy Manager (com suporte a HTTPS/SSL).

---

## 3. Estrutura de Arquivos para Deploy

Os seguintes arquivos no diretório raiz do projeto são críticos para o processo de deploy:

| Arquivo / Diretório | Finalidade |
| :--- | :--- |
| `Dockerfile` | Define as etapas de construção (multi-stage build) da imagem de produção do Next.js. |
| `docker-compose.yml` | Orquestra os containers da aplicação (`app`) e do banco de dados (`postgres`). |
| `.env` | Contém as credenciais confidenciais de ambiente em produção (não deve ser enviado ao Git). |
| `.env.example` | Modelo público contendo as chaves das variáveis de ambiente necessárias. |
| `.dockerignore` | Evita que arquivos desnecessários (como `node_modules` e `.next`) sejam enviados ao contexto do Docker. |
| `entrypoint.sh` | Shell script executado na inicialização do container principal para rodar migrations, seeds e iniciar o Next.js. |
| `prisma/` | Contém o arquivo `schema.prisma`, migrações SQL (`migrations/`) e o script de semente (`seed.ts`). |
| `DEPLOY.md` | Este documento de referência oficial de deploy. |
| `README.md` | Guia geral de desenvolvimento e introdução ao projeto. |

---

## 4. Clonando o Projeto

Acesse o servidor de produção e clone o repositório utilizando Git:

```bash
# Clonar o repositório oficial
git clone https://github.com/islunyorg/isluny-works.git /opt/isluny-works

# Entrar no diretório do projeto
cd /opt/isluny-works
```

---

## 5. Configuração das Variáveis de Ambiente

O IsLuny Works em produção **não depende de arquivos `.env`**. Em vez disso, todas as variáveis de ambiente devem ser exportadas diretamente no shell do sistema operacional do host antes de executar o Docker Compose. Isso garante total conformidade com as diretivas de segurança (Twelve-Factor App) e simplifica pipelines de CI/CD.

### Como Definir as Variáveis no Ambiente do Servidor
Antes de subir os containers, defina as variáveis obrigatórias exportando-as no seu terminal:

```bash
# Definir as credenciais do banco
export POSTGRES_USER="isluny_admin"
export POSTGRES_PASSWORD="Ua9#dK8!2qPz"
export POSTGRES_DB="isluny_works_prod"

# Definir a string de conexão (caso queira usar um banco externo ou customizado)
export DATABASE_URL="postgresql://isluny_admin:Ua9#dK8!2qPz@postgres:5432/isluny_works_prod?schema=public"

# Definir parâmetros do Auth.js
export NEXTAUTH_URL="https://works.isluny.org"
export NEXTAUTH_SECRET="8e77a2ef6ba3a76387f5be24867140f7d5402cbb346..."

# Definir modo de execução
export NODE_ENV="production"
```

> [!TIP]
> Para tornar essas variáveis persistentes entre reinicializações do terminal no servidor, você pode adicioná-las ao arquivo `/etc/environment` do Linux ou usar ferramentas de provisionamento de infraestrutura (como Ansible ou Terraform) que injetam segredos no pipeline.

| Variável | Descrição | Obrigatória? | Exemplo de Uso |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Define o modo de execução da aplicação. Em produção deve ser `production`. | Sim | `production` |
| `POSTGRES_USER` | Nome do usuário administrador do banco de dados PostgreSQL. | Sim | `isluny_admin` |
| `POSTGRES_PASSWORD` | Senha forte de acesso ao PostgreSQL. | Sim | `Ua9#dK8!2qPz` |
| `POSTGRES_DB` | Nome do banco de dados do sistema. | Sim | `isluny_works_prod` |
| `DATABASE_URL` | String de conexão utilizada pelo Prisma para se comunicar com o banco de dados. | Sim | `postgresql://isluny_admin:Ua9#dK8!2qPz@postgres:5432/isluny_works_prod?schema=public` |
| `NEXTAUTH_URL` | URL pública onde a aplicação está hospedada. Importante para os redirecionamentos do Auth.js. | Sim | `https://works.isluny.org` |
| `NEXTAUTH_SECRET` | Chave secreta de criptografia para assinar os tokens de sessão (JWT). | Sim | `8e77a2ef6ba3a76387f5be24867140f7d5402cbb346...` |
| `PORT` | Porta interna na qual o servidor Next.js escutará (padrão: `3000`). | Não | `3000` |

### Validação na Inicialização
Para garantir a estabilidade e evitar comportamentos inconsistentes:
1. **Validação do Container**: O container realiza uma verificação prévia obrigatória. Se as variáveis `DATABASE_URL`, `NEXTAUTH_SECRET` ou `NEXTAUTH_URL` não estiverem presentes no ambiente herdado pelo Docker, o container interrompe a inicialização exibindo mensagens de erro descritivas no console:
   ```text
   ❌ ERROR: A variável de ambiente DATABASE_URL está ausente.
   ❌ Falha na inicialização: Configure as variáveis obrigatórias no ambiente do container.
   ```
2. **Independência do Build**: The IsLuny Works utiliza o modo `standalone` do Next.js. Nenhum segredo ou credencial de banco de dados é embutido no código compilado durante a etapa de build (`next build`), permitindo que a mesma imagem Docker gerada seja executada em diferentes ambientes mudando apenas o runtime.

> [!IMPORTANT]
> Nunca salve ou comite segredos no repositório do Git. Para gerar um `NEXTAUTH_SECRET` robusto, execute o seguinte comando:
> ```bash
> openssl rand -base64 32
> ```

---

## 6. Configuração do PostgreSQL

A infraestrutura do IsLuny Works permite utilizar um banco de dados hospedado localmente (no Compose) ou externamente.

### A. Banco de Dados Local (Via Docker Compose)
O serviço `postgres` no arquivo `docker-compose.yml` inicia uma instância isolada do PostgreSQL `15-alpine`.
- O banco expõe a porta `9347` no host externo, mas a aplicação se conecta internamente pela porta `5432`.
- Os dados do banco são mantidos de forma persistente através do volume nomeado do Docker: `postgres_data`.

### B. Banco de Dados Externo (RDS, Azure, Google Cloud SQL, etc.)
Caso queira utilizar um serviço de banco de dados gerenciado em nuvem:
1. Remova ou comente o serviço `postgres` do arquivo `docker-compose.yml`.
2. Atualize a variável `DATABASE_URL` no arquivo `.env` para apontar para a URL do banco externo, incluindo os devidos parâmetros de conexão (ex: `sslmode=require`).

---

## 7. Comandos do Prisma em Produção

O IsLuny Works utiliza o Prisma ORM para gerenciar o esquema e a comunicação com o banco de dados. A execução dos comandos necessários é realizada automaticamente pelo script de entrada `entrypoint.sh` do container, mas é importante conhecer sua finalidade:

- **`npx prisma generate`**: Executado durante a etapa de build da imagem Docker para gerar o Prisma Client tipado de acordo com o esquema definido em `schema.prisma`.
- **`npx prisma migrate deploy`**: Aplica todas as migrações pendentes no banco de dados sem deletar dados existentes. Nunca use `migrate dev` em produção.
- **`npx prisma db seed`**: Popula o banco de dados com registros fundamentais (como as permissões RBAC padrão e os cargos de Administrador e Colaborador). O script de seed é seguro contra duplicação de dados, pois utiliza operações `upsert`.

Se houver alguma alteração no arquivo `schema.prisma`, execute o build da imagem Docker novamente para que o cliente do Prisma e os arquivos gerados sejam atualizados.

---

## 8. Dockerfile e Otimizações de Imagem

O IsLuny Works utiliza uma imagem Docker otimizada baseada em um processo de **Multi-stage Build** em 3 etapas (`deps`, `builder` e `runner`):

1. **Etapa `deps`**: Instala apenas as dependências do projeto através do comando `npm ci --legacy-peer-deps` em um ambiente Alpine Linux mínimo.
2. **Etapa `builder`**: Copia o código-fonte, gera os tipos do cliente do Prisma e executa o build de produção (`npm run build`). O build do Next.js está configurado para gerar a saída **`standalone`** (Next.js Standalone), reduzindo drasticamente o tamanho final da imagem pois apenas os arquivos estritamente necessários para rodar a aplicação em produção são copiados.
3. **Etapa `runner`**: Monta o container final de execução:
   - Instala a biblioteca `openssl` exigida pelo Prisma Client no Alpine.
   - Cria um usuário e grupo não-root (`nextjs` com UID/GID `1001`) para reforçar a segurança do container.
   - Executa o container com o usuário `nextjs` e inicia a aplicação através do script `entrypoint.sh`.

---

## 9. docker-compose.yml Explicação dos Serviços

O arquivo `docker-compose.yml` define os serviços essenciais para a execução estável do IsLuny Works:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: clock-postgres
    # ...
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-clock_system}"]
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: clock-app
    # ...
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
```

### Detalhes de Configuração:
- **Rede Privada**: O Docker cria uma rede interna comum para que os containers se comuniquem de forma segura usando nomes de host (ex: `postgres`).
- **Restart Policy**: Configurado como `unless-stopped` em ambos os serviços, garantindo que o container reinicie automaticamente em caso de falhas ou se o daemon do Docker for reiniciado, a menos que seja parado manualmente pelo administrador.
- **Depends On**: O container `app` só iniciará após a validação do `healthcheck` do banco de dados (usando `pg_isready`), evitando falhas de inicialização por indisponibilidade momentânea do PostgreSQL.

---

## 10. Inicialização da Aplicação

Siga o passo a passo abaixo para iniciar os containers do IsLuny Works em modo daemon (segundo plano):

```bash
# Executar o build e inicializar os containers
docker-compose up -d --build
```

### O que acontece na inicialização?
1. O Docker baixa a imagem do PostgreSQL 15 (se não estiver local) e inicia o container `clock-postgres`.
2. O Docker constrói a imagem local da aplicação com base no `Dockerfile` e inicia o container `clock-app`.
3. O script `entrypoint.sh` do container `clock-app` roda:
   - Executa as migrações pendentes do banco de dados.
   - Executa a seed do banco (configurando usuários padrão, cargos e permissões).
   - Inicia o Next.js na porta `3000`.

Para verificar se tudo iniciou com sucesso, acompanhe os logs:
```bash
docker logs -f clock-app
```

---

## 11. Atualização da Aplicação em Produção

Para aplicar atualizações de código ou novas releases do sistema de forma segura, siga o fluxo documentado abaixo:

### Passo 1: Backup preventivo do Banco de Dados
```bash
docker exec -t clock-postgres pg_dumpall -U postgres > /opt/backups/before_update_$(date +%F).sql
```

### Passo 2: Atualização do Código Fonte
```bash
# Obter as alterações do repositório
git pull origin main
```

### Passo 3: Build e reinicialização dos containers
```bash
# Reconstrói a imagem da aplicação e reinicia os serviços em segundo plano
docker-compose up -d --build --remove-orphans
```

### Passo 4: Verificação dos Logs
```bash
# Verificar se as migrações executaram com sucesso e se o servidor iniciou
docker logs -f clock-app
```

---

## 12. Backup e Restauração

### Backup do PostgreSQL
O backup periódico do banco de dados é obrigatório. Agende um script no `cron` do sistema para rodar backups diários:

```bash
# Executa o dump do banco de dados compactando o arquivo final
docker exec -t clock-postgres pg_dump -U postgres clock_system | gzip > /opt/backups/db_backup_$(date +%F_%H%M%S).sql.gz
```

### Restauração do PostgreSQL
Caso precise restaurar um backup:

```bash
# Descompactar o backup
gunzip /opt/backups/db_backup_XXXX_XX_XX.sql.gz

# Restaurar o arquivo .sql diretamente para o container do banco de dados
cat /opt/backups/db_backup_XXXX_XX_XX.sql | docker exec -i clock-postgres psql -U postgres -d clock_system
```

---

## 13. Logs da Aplicação

Use os comandos do Docker para investigar falhas de execução e depurar o comportamento do sistema:

- **Logs Gerais do Compose**:
  ```bash
  docker-compose logs -f --tail=100
  ```
- **Logs Específicos do Next.js (app)**:
  ```bash
  docker logs -f clock-app
  ```
- **Logs Específicos do Banco de Dados (postgres)**:
  ```bash
  docker logs -f clock-postgres
  ```

---

## 14. Endpoint de Health Check

O IsLuny Works disponibiliza um endpoint de saúde para integração com ferramentas de monitoramento como Uptime Kuma ou roteadores de balanceamento de carga:

- **URL**: `https://works.isluny.org/api/health`
- **Método**: `GET`
- **Exemplo de Retorno Saudável (HTTP 200)**:
  ```json
  {
    "status": "UP",
    "timestamp": "2026-07-13T11:15:30.123Z",
    "services": {
      "database": "UP"
    },
    "system": {
      "uptime": 14502.45,
      "memoryUsage": {
        "rss": 84520192,
        "heapTotal": 41258240,
        "heapUsed": 29845120,
        "external": 1458021
      },
      "nodeVersion": "v20.12.0"
    }
  }
  ```
- **Exemplo de Retorno com Falha (HTTP 500)**:
  ```json
  {
    "status": "DOWN",
    "timestamp": "2026-07-13T11:15:35.000Z",
    "services": {
      "database": "DOWN"
    },
    "error": "Can't reach database server at postgres:5432"
  }
  ```

---

## 15. Configurações de Reverse Proxy

A exposição direta da porta `9340` (porta pública da aplicação) para a internet não é recomendável. Use um proxy reverso para lidar com certificados SSL, HTTPS e roteamento.

### A. Configuração com Nginx
Adicione a seguinte configuração ao arquivo de bloco de servidor (`/etc/nginx/sites-available/isluny-works`):

```nginx
server {
    listen 80;
    server_name works.isluny.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name works.isluny.org;

    ssl_certificate /etc/letsencrypt/live/works.isluny.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/works.isluny.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9340;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cabeçalhos importantes para encaminhamento de IP real e SSL (Auth.js)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### B. Configuração com Traefik
Adicione labels de configuração ao serviço `app` no seu arquivo `docker-compose.yml`:

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.isluny-app.rule=Host(`works.isluny.org`)"
      - "traefik.http.routers.isluny-app.entrypoints=websecure"
      - "traefik.http.routers.isluny-app.tls.certresolver=myresolver"
      - "traefik.http.services.isluny-app.loadbalancer.server.port=3000"
```

### C. Nginx Proxy Manager (Interface Gráfica)
Se você estiver utilizando o NPM:
1. Adicione um novo **Proxy Host**.
2. Configure **Domain Names** como `works.isluny.org`.
3. Configure **Scheme** como `http`, **Forward Host IP** como `127.0.0.1` (ou o IP local do container) e **Forward Port** como `9340`.
4. Ative **Block Common Exploits**, **Websockets Support**.
5. Na aba **SSL**, selecione o certificado Let's Encrypt, ative **Force SSL**, **HTTP/2 Support** e **HSTS Enabled**.

---

## 16. Recomendações de Segurança

Para mitigar riscos e proteger o IsLuny Works contra ataques maliciosos:

1. **HTTPS Obrigatório**: Nunca trafegue sessões de autenticação sob conexões HTTP comuns. Use certificados Let's Encrypt (SSL/TLS) e force HTTPS.
2. **Arquivos de Configuração Protegidos**: Ajuste a permissão do arquivo `.env` para que apenas proprietários do deploy possam lê-lo: `chmod 600 .env`.
3. **Containers Não-Root**: Não comente a instrução `USER nextjs` no Dockerfile. Executar processos como root dentro do container facilita vulnerabilidades de escape.
4. **Firewall do Host**: Bloqueie portas que não devam estar acessíveis externamente (ex: restrinja a porta `9347` do PostgreSQL para que apenas IPs confiáveis ou localhost consigam acessá-la).
5. **Atualização de Imagens**: Atualize periodicamente a imagem base Alpine do Node.js executando `docker-compose pull` para baixar patches de segurança atualizados.

---

## 17. Escalabilidade e Alta Disponibilidade

Se o volume de batidas de ponto crescer a ponto de necessitar de alta disponibilidade:

### Balanceamento de Carga
Você pode implantar múltiplas instâncias da aplicação IsLuny Works usando o comando:
```bash
docker-compose up -d --scale app=3
```
- Nesse caso, garanta que seu reverse proxy (Nginx ou Traefik) atue como balanceador de carga, distribuindo requisições entre as instâncias da aplicação.

### Banco de Dados Separado
Substitua a instância local `clock-postgres` por um serviço gerenciado robusto (Amazon RDS, Google Cloud SQL, etc.) para garantir failover automático, backups redundantes e isolamento de carga.

---

## 18. Solução de Problemas (FAQ)

### 🔴 A aplicação não conecta com o banco de dados
- **Causa**: O PostgreSQL ainda está inicializando ou os parâmetros no `.env` estão incorretos.
- **Solução**: Verifique se o container `clock-postgres` está rodando e execute `docker ps`. Valide se a string `DATABASE_URL` no `.env` está formatada exatamente de acordo com as credenciais definidas em `POSTGRES_USER` e `POSTGRES_PASSWORD`.

### 🔴 Erro de compilação ou falha nas migrations do Prisma
- **Causa**: O esquema do banco diverge do schema atual do Prisma, ou há dados inconsistentes salvos.
- **Solução**: Verifique o log com `docker logs clock-app`. Se necessário, conecte-se ao banco e confirme se o histórico do Prisma está correto. Você pode forçar a geração de cliente executando `npx prisma generate` localmente no container.

### 🔴 O Auth.js (NextAuth) exibe erro de autenticação ou redireciona incorretamente
- **Causa**: A variável `NEXTAUTH_URL` não coincide com o domínio acessado, ou falta encaminhamento dos cabeçalhos do proxy reverso.
- **Solução**: Certifique-se de que `NEXTAUTH_URL` no `.env` corresponde exatamente à URL pública. Em proxies reversos como Nginx, garanta que os cabeçalhos `X-Forwarded-Proto https` e `X-Forwarded-For` estejam definidos corretamente.

### 🔴 O container do app entra em loop de reinicialização
- **Causa**: O script `entrypoint.sh` falhou ao executar comandos críticos ou as variáveis de ambiente não foram carregadas.
- **Solução**: Inicie o container em modo manual para inspecionar executando `docker-compose run app sh` e rode os comandos do entrypoint individualmente para identificar qual etapa está quebrando.

---

## 19. Monitoramento Recomendado

Integre as seguintes soluções para acompanhar a saúde e o uso do IsLuny Works em tempo real:

- **Uptime Kuma**: Monitore a disponibilidade do sistema apontando para o endpoint `/api/health` em intervalos de 60 segundos com alertas de queda integrados no Slack ou Discord.
- **Prometheus & Grafana**: Acompanhe o consumo de RAM/CPU do servidor host e colete métricas através de exportadores do Docker e do sistema.
- **Loki & Promtail**: Centralize todos os logs de saída dos containers em um painel do Grafana facilitando a busca por termos como `error`, `failed` ou `unauthorized`.
- **Portainer**: Facilita a visualização gráfica, reinicialização e leitura de logs dos containers no servidor host através de uma interface web segura.

---

## 20. Fluxo de Implantação (Workflow)

```mermaid
flowchart TD
  A["Clonar o Repositório Git"] --> B["Exportar Variáveis no Ambiente"]
  B --> C["Ajustar Firewall e Proxy Reverso"]
  C --> D["Executar docker-compose up -d --build"]
  D --> E["Database Health Check (pg_isready)"]
  E -- "Sucesso" --> F["Executar Migrations (Prisma)"]
  E -- "Falha" --> D
  F --> G["Executar Seeds (Cargos e Permissões)"]
  G --> H["Iniciar Next.js (Standalone)"]
  H --> I["Testar Endpoint /api/health"]
  I -- "Saudável" --> J["Aplicação Pronta em Produção"]
  I -- "Falha" --> K["Depurar Logs (docker logs clock-app)"]
```

---

## 21. Checklist de Deploy em Produção

Valide todos os itens abaixo antes de liberar a plataforma para os colaboradores da **IsLuny Org**:

- [ ] Variáveis de ambiente exportadas corretamente no host/servidor.
- [ ] Variável `NODE_ENV` definida como `production`.
- [ ] Chave `NEXTAUTH_SECRET` gerada usando um gerador seguro.
- [ ] Variável `NEXTAUTH_URL` aponta para o domínio HTTPS definitivo.
- [ ] Porta externa `9347` (PostgreSQL) protegida por firewall.
- [ ] Porta externa `9340` (App) acessada apenas por meio do Proxy Reverso.
- [ ] Certificado SSL (Let's Encrypt) instalado e HTTPS ativo.
- [ ] Executadas todas as migrations com sucesso (`prisma migrate deploy`).
- [ ] Banco de dados semeado (`prisma db seed`).
- [ ] Endpoint `/api/health` respondendo `UP` (HTTP 200).
- [ ] Usuário administrador principal ativo no sistema.
- [ ] Backup automático do banco de dados configurado no cron.
