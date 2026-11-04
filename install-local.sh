#!/bin/bash
set -e

# ============================================================
# CONFIGURAÇÃO DA CLOUD LOCAL E BRANCHES (Altere facilmente)
# ============================================================
LOCAL_CLOUD_IP="${LOCAL_CLOUD_IP:-192.168.0.181}"
CLOUD_URL="https://${LOCAL_CLOUD_IP}/api"

BACKEND_BRANCH="${BACKEND_BRANCH:-teste}"
FRONTEND_BRANCH="${FRONTEND_BRANCH:-teste}"

# ============================================================
# Configuração da aplicação (Single Server Deployment)
# ============================================================

APP_NAME="agent-proxmox"

APP_DIR="/opt/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"

BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$BACKEND_DIR/static"

BACKEND_REPO="https://github.com/Douglasgls/proxmox-manager-api.git"
FRONTEND_REPO="https://github.com/Douglasgls/proxmox-manager-app.git"

BACKEND_SERVICE="agent-proxmox.service"

BACKEND_PORT="8000"

DB_NAME="agent_proxmox"
DB_USER="agent_proxmox"

DB_CONFIG_FILE="$CONFIG_DIR/database.env"
BACKEND_CONFIG_FILE="$CONFIG_DIR/backend.env"

# ============================================================
# Funções Utilitárias Base
# ============================================================

log() {
    echo -e "\n[INFO] $1"
}

warn() {
    echo -e "\n[AVISO] $1"
}

error() {
    echo -e "\n[ERRO] $1"
    exit 1
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Este script precisa ser executado como root (use sudo)."
    fi
}

check_os() {
    if ! grep -q -E "Debian|Proxmox|Ubuntu" /etc/os-release; then
        error "Este script foi feito para rodar em Debian / Proxmox VE."
    fi
}

prepare_directories() {
    log "Preparando diretórios base em $APP_DIR..."
    mkdir -p "$APP_DIR"
    mkdir -p "$CONFIG_DIR"
    chmod 750 "$CONFIG_DIR"
}

get_server_ip() {
    SERVER_IP=$(hostname -I | awk '{print $1}')

    if [ -z "$SERVER_IP" ]; then
        error "Não foi possível identificar o IP do servidor."
    fi

    log "IP do servidor Proxmox detectado: $SERVER_IP"
    log "Cloud Local configurada para:     $CLOUD_URL"
    log "Branch do Backend (API):          $BACKEND_BRANCH"
    log "Branch do Frontend (App):         $FRONTEND_BRANCH"
}

sync_system_clock() {
    log "Sincronizando relógio da VM (evita erros de certificado SSL e assinatura APT após snapshot)..."

    # Tenta pegar a data/hora UTC via HTTP da Cloud Local (com -k) ou do repositório Debian (HTTP puro)
    REMOTE_DATE=$(curl -sIk "https://${LOCAL_CLOUD_IP}" | grep -i '^date:' | sed 's/^[Dd]ate: //;s/\r//')
    if [ -z "$REMOTE_DATE" ]; then
        REMOTE_DATE=$(curl -sI "http://deb.debian.org" | grep -i '^date:' | sed 's/^[Dd]ate: //;s/\r//')
    fi

    if [ -n "$REMOTE_DATE" ]; then
        date -u -s "$REMOTE_DATE" >/dev/null 2>&1 || true
        log "Relógio atualizado para: $(date)"
    else
        warn "Não foi possível obter a data via HTTP. Mantendo relógio atual: $(date)"
    fi

    timedatectl set-ntp true 2>/dev/null || true
}

# ============================================================
# Certificados TLS da Cloud Local (Caddy Root CA)
# ============================================================

configure_local_ca() {
    log "Instalando certificado Root CA da Cloud Local ($LOCAL_CLOUD_IP)..."

    # Se houver um caddy-root.crt na pasta atual ou em /tmp, prioriza ele;
    # caso contrário, usa o certificado Root CA embutido da Cloud Local
    if [ -f "./caddy-root.crt" ]; then
        log "Usando ./caddy-root.crt do diretório atual..."
        cp "./caddy-root.crt" /usr/local/share/ca-certificates/caddy-root.crt
    elif [ -f "/tmp/caddy-root.crt" ]; then
        log "Usando /tmp/caddy-root.crt..."
        cp "/tmp/caddy-root.crt" /usr/local/share/ca-certificates/caddy-root.crt
    elif [ ! -f "/usr/local/share/ca-certificates/caddy-root.crt" ]; then
        log "Gravando certificado caddy-root.crt em /usr/local/share/ca-certificates/..."
        cat > /usr/local/share/ca-certificates/caddy-root.crt <<'EOF'
-----BEGIN CERTIFICATE-----
MIIBozCCAUqgAwIBAgIRAJdfXti9RqT9YP9H4S7Y4aIwCgYIKoZIzj0EAwIwMDEu
MCwGA1UEAxMlQ2FkZHkgTG9jYWwgQXV0aG9yaXR5IC0gMjAyNiBFQ0MgUm9vdDAe
Fw0yNjExMDMxODE0MTRaFw0zNjA5MTExODE0MTRaMDAxLjAsBgNVBAMTJUNhZGR5
IExvY2FsIEF1dGhvcml0eSAtIDIwMjYgRUNDIFJvb3QwWTATBgcqhkjOPQIBBggq
hkjOPQMBBwNCAATkolmvtL8pr9y7qOa22d8ZyNC8B594OsYQwNVrcAqqdTVsy01p
kDbNWn/+YQGvKiy4dY5Y7ga7VcgXbevj6gSLo0UwQzAOBgNVHQ8BAf8EBAMCAQYw
EgYDVR0TAQH/BAgwBgEB/wIBATAdBgNVHQ4EFgQU8QkWytjGCXNLf3mNo6IM8loq
1DswCgYIKoZIzj0EAwIDRwAwRAIgCFzGEUG9TXFmpaLBWo1U5ZKy/9wo8cdPuShk
9HB9o8cCIADr77k64+IIOKuiYbe5cUgXqAFL1Zi0zMF2oQ23HCNb
-----END CERTIFICATE-----
EOF
    fi

    chmod 644 /usr/local/share/ca-certificates/caddy-root.crt
    log "Atualizando cadeia de certificados do sistema (update-ca-certificates)..."
    update-ca-certificates
}

# ============================================================
# PostgreSQL
# ============================================================

install_database() {
    log "Instalando PostgreSQL e dependências básicas..."
    # '|| true' previne que o script aborte caso repositórios do Proxmox Enterprise estejam sem licença e deem erro de GPG/Update
    apt-get update || true
    apt-get install -y postgresql postgresql-client openssl curl git unzip python3 ca-certificates
    log "PostgreSQL e dependências instaladas."
}

init_database() {
    log "Iniciando PostgreSQL..."
    systemctl enable postgresql
    systemctl start postgresql

    if ! systemctl is-active --quiet postgresql; then
        error "Não foi possível iniciar o PostgreSQL."
    fi
    log "PostgreSQL está em execução."
}

create_database_user() {
    log "Configurando usuário do PostgreSQL..."

    if runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        log "Usuário '$DB_USER' já existe."
        if [ ! -f "$DB_CONFIG_FILE" ]; then
            log "Aviso: Usuário existe, mas o arquivo de configuração não foi encontrado. Gerando nova senha..."
            DB_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
            runuser -u postgres -- psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
            
            cat > "$DB_CONFIG_FILE" <<EOF
DATABASE_URL=postgresql+psycopg://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME
EOF
            chmod 600 "$DB_CONFIG_FILE"
            log "Senha resetada e arquivo de configuração recriado."
        fi
        return
    fi

    DB_PASSWORD=$(openssl rand -hex 32)
    log "Criando usuário '$DB_USER'..."

    runuser -u postgres -- psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

    cat > "$DB_CONFIG_FILE" <<EOF
DATABASE_URL=postgresql+psycopg://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME
EOF

    chmod 600 "$DB_CONFIG_FILE"
    log "Usuário criado."
}

create_database() {
    log "Configurando banco de dados..."

    if runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
        log "Banco '$DB_NAME' já existe."
        return
    fi

    runuser -u postgres -- createdb -O "$DB_USER" "$DB_NAME"
    log "Banco '$DB_NAME' criado."
}

grant_permissions() {
    log "Configurando permissões do Banco..."
    runuser -u postgres -- psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    runuser -u postgres -- psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    log "Permissões configuradas."
}

check_database() {
    log "Verificando banco de dados..."

    if ! systemctl is-active --quiet postgresql; then
        error "PostgreSQL não está em execução."
    fi

    if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
        error "Banco '$DB_NAME' não encontrado."
    fi

    if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        error "Usuário '$DB_USER' não encontrado."
    fi

    log "Banco de dados verificado com sucesso."
}

install_database_stack() {
    log "========================================="
    log "Configurando PostgreSQL"
    log "========================================="
    install_database
    init_database
    create_database_user
    create_database
    grant_permissions
    check_database
    log "PostgreSQL configurado com sucesso."
}

# ============================================================
# Backend (FastAPI / Agent)
# ============================================================

generate_backend_config() {
    log "Gerando/atualizando configuração do backend para Cloud Local ($CLOUD_URL)..."

    if [ ! -f "$DB_CONFIG_FILE" ]; then
        error "Arquivo $DB_CONFIG_FILE não encontrado."
    fi

    source "$DB_CONFIG_FILE"

    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL não foi encontrada."
    fi

    # Se o arquivo já existir (ex: instalação prévia), apenas atualiza a CLOUD_URL e variáveis de certificado
    if [ -f "$BACKEND_CONFIG_FILE" ]; then
        log "Configuração do backend já existe. Atualizando CLOUD_URL para $CLOUD_URL..."
        if grep -q "^CLOUD_URL=" "$BACKEND_CONFIG_FILE"; then
            sed -i "s|^CLOUD_URL=.*|CLOUD_URL=$CLOUD_URL|g" "$BACKEND_CONFIG_FILE"
        else
            echo "CLOUD_URL=$CLOUD_URL" >> "$BACKEND_CONFIG_FILE"
        fi

        if ! grep -q "^SSL_CERT_FILE=" "$BACKEND_CONFIG_FILE"; then
            echo "SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt" >> "$BACKEND_CONFIG_FILE"
        fi

        if ! grep -q "^REQUESTS_CA_BUNDLE=" "$BACKEND_CONFIG_FILE"; then
            echo "REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt" >> "$BACKEND_CONFIG_FILE"
        fi

        log "Configuração existente atualizada com sucesso."
        return
    fi

    AGENT_ENCRYPTION_KEY=$(python3 - <<'PY'
import base64
import os
print(base64.urlsafe_b64encode(os.urandom(32)).decode())
PY
)

    if [ -z "$AGENT_ENCRYPTION_KEY" ]; then
        error "Não foi possível gerar AGENT_ENCRYPTION_KEY."
    fi

    CLOUD_ENCRYPTION_KEY=$(python3 - <<'PY'
import base64
import os
print(base64.urlsafe_b64encode(os.urandom(32)).decode())
PY
)

    if [ -z "$CLOUD_ENCRYPTION_KEY" ]; then
        error "Não foi possível gerar CLOUD_ENCRYPTION_KEY."
    fi

    JWT_SECRET_KEY=$(openssl rand -hex 64)

    cat > "$BACKEND_CONFIG_FILE" <<EOF
# Banco de dados
DATABASE_URL=$DATABASE_URL

# Criptografia interna e Nuvem
AGENT_ENCRYPTION_KEY=$AGENT_ENCRYPTION_KEY
CLOUD_ENCRYPTION_KEY=$CLOUD_ENCRYPTION_KEY

# Conexão com o Painel de Controle Cloud Local
CLOUD_URL=$CLOUD_URL

# Usa o bundle de certificados do sistema (necessário para confiar no caddy-root.crt local)
SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# JWT
JWT_SECRET_KEY=$JWT_SECRET_KEY
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
EOF

    chmod 600 "$BACKEND_CONFIG_FILE"
    log "Configuração do backend criada apontando para $CLOUD_URL."
}

install_uv() {
    log "Verificando uv..."
    
    # O systemd espera o uv sempre em /usr/local/bin/uv
    if [ -x "/usr/local/bin/uv" ]; then
        log "uv já está instalado no diretório global esperado."
        return
    fi

    if command -v uv >/dev/null 2>&1; then
        UV_PATH=$(command -v uv)
        log "uv encontrado em $UV_PATH. Copiando para /usr/local/bin/uv..."
        install -m 0755 "$UV_PATH" /usr/local/bin/uv
        return
    fi

    log "Instalando uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    if [ -x /root/.local/bin/uv ]; then
        install -m 0755 /root/.local/bin/uv /usr/local/bin/uv
    fi

    if [ ! -x /usr/local/bin/uv ]; then
        error "Não foi possível colocar o uv em /usr/local/bin/uv."
    fi
    
    log "uv instalado com sucesso."
}

clone_backend() {
    log "Preparando backend (branch: $BACKEND_BRANCH)..."
    if [ -d "$BACKEND_DIR/.git" ]; then
        log "Backend já existe. Atualizando para a branch $BACKEND_BRANCH..."
        cd "$BACKEND_DIR"
        git remote set-branches origin '*' || true
        git fetch --all --prune
        git checkout -B "$BACKEND_BRANCH" "origin/$BACKEND_BRANCH"
    else
        if [ -d "$BACKEND_DIR" ]; then
            log "Diretório do backend existe mas não é um repositório git. Recriando..."
            rm -rf "$BACKEND_DIR"
        fi
        git clone -b "$BACKEND_BRANCH" "$BACKEND_REPO" "$BACKEND_DIR"
    fi
    log "Backend disponível em $BACKEND_DIR (branch: $BACKEND_BRANCH)."
}

install_backend_dependencies() {
    log "Instalando dependências do backend..."
    cd "$BACKEND_DIR"
    /usr/local/bin/uv python install 3.13
    /usr/local/bin/uv sync --python 3.13
    log "Dependências instaladas."
}

run_database_migrations() {
    log "Executando migrations..."
    cd "$BACKEND_DIR"
    set -a
    source "$BACKEND_CONFIG_FILE"
    set +a
    /usr/local/bin/uv run alembic upgrade head
    log "Migrations executadas com sucesso."
}

# ============================================================
# Frontend Estático (Compilado da branch: $FRONTEND_BRANCH)
# ============================================================

install_node() {
    log "Verificando Node.js para compilação do frontend..."
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        NODE_MAJOR=$(node -v | tr -d 'v' | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -ge 20 ]; then
            log "Node.js $(node -v) já está instalado."
            return
        fi
    fi

    log "Instalando Node.js 22 LTS via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    log "Node.js instalado com sucesso: $(node -v)"
}

install_frontend() {
    log "Instalando Frontend Estático a partir da branch '$FRONTEND_BRANCH'..."
    install_node

    local FRONTEND_TEMP_DIR="/tmp/frontend_local_build"
    rm -rf "$FRONTEND_TEMP_DIR"
    mkdir -p "$FRONTEND_TEMP_DIR"

    log "Clonando frontend (branch: $FRONTEND_BRANCH)..."
    git clone --depth 1 -b "$FRONTEND_BRANCH" "$FRONTEND_REPO" "$FRONTEND_TEMP_DIR"

    cd "$FRONTEND_TEMP_DIR"
    log "Instalando dependências do frontend (npm install)..."
    npm install

    log "Configurando variáveis de ambiente do frontend..."
    echo "VITE_API_URL=/api" > .env.production
    echo "VITE_WS_URL=" >> .env.production

    log "Compilando frontend (npm run build)..."
    npm run build

    log "Copiando build para $FRONTEND_DIR..."
    mkdir -p "$FRONTEND_DIR"
    rm -rf "$FRONTEND_DIR"/*
    cp -r "$FRONTEND_TEMP_DIR/dist"/* "$FRONTEND_DIR/"

    rm -rf "$FRONTEND_TEMP_DIR"
    log "Frontend compilado e copiado para $FRONTEND_DIR com sucesso."
}

# ============================================================
# Serviços e Finalização
# ============================================================

create_backend_service() {
    log "Criando serviço systemd do Agent..."

    cat > "/etc/systemd/system/$BACKEND_SERVICE" <<EOF
[Unit]
Description=Proxmox Manager Agent (Local Cloud Test)
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_CONFIG_FILE
ExecStart=/usr/local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable "$BACKEND_SERVICE"
    log "Serviço criado."
}

start_backend_service() {
    log "Iniciando Agent ($BACKEND_SERVICE)..."
    systemctl restart "$BACKEND_SERVICE"
    log "Serviço acionado."
}

check_backend_service() {
    log "Aguardando e verificando Health Check do Agent na porta $BACKEND_PORT..."
    local max_attempts=20
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if ! systemctl is-active --quiet "$BACKEND_SERVICE"; then
            echo ""
            journalctl -u "$BACKEND_SERVICE" --no-pager -n 50
            error "O serviço $BACKEND_SERVICE parou de responder durante a inicialização."
        fi

        if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$BACKEND_PORT" >/dev/null 2>&1; then
            echo ""
            log "Health check OK! Agent respondendo com sucesso na porta $BACKEND_PORT."
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    journalctl -u "$BACKEND_SERVICE" --no-pager -n 50
    error "Agent não respondeu na porta $BACKEND_PORT após 40 segundos de inicialização."
}

main() {
    check_root
    check_os
    prepare_directories
    get_server_ip

    # 0. Sincroniza o relógio do Proxmox (corrige erro de SSL/APT quando a VM volta de snapshot)
    sync_system_clock

    # 1. Banco
    install_database_stack

    # 2. Certificado CA da Cloud Local
    configure_local_ca

    # 3. Prepara o Backend (Git Clone - branch configurada)
    install_uv
    clone_backend

    # 4. Compila e instala o Frontend (branch configurada)
    install_frontend

    # 5. Configura, instala dependências e sobe o Agent (Backend)
    generate_backend_config
    install_backend_dependencies
    run_database_migrations
    create_backend_service
    start_backend_service
    check_backend_service

    log "========================================="
    log "INSTALAÇÃO LOCAL CONCLUÍDA"
    log "========================================="
    echo
    echo "• Painel Local Proxmox: http://$SERVER_IP:$BACKEND_PORT"
    echo "• Apontando para Cloud: $CLOUD_URL"
    echo "• Branch Backend/Front: $BACKEND_BRANCH / $FRONTEND_BRANCH"
    echo "• Arquivo de Config:    $BACKEND_CONFIG_FILE"
    echo
}

main "$@"
