# Estágio de construção (Build Stage)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

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
