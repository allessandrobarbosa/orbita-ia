# Estágio de desenvolvimento (Development Stage)
FROM node:20-alpine AS development

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código-fonte (para ter disponível no container se o volume falhar, mas o volume irá sobrescrever)
COPY . .

# Estágio de construção (Build Stage)
FROM development AS builder

# Compilar o frontend e backend
RUN npm run build

# Estágio de execução em produção (Production Stage)
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copiar dependências de produção apenas
COPY package*.json ./
RUN npm ci --only=production

# Copiar os arquivos compilados do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Expor a porta que o Express escuta (3000)
EXPOSE 3000

CMD ["npm", "start"]
