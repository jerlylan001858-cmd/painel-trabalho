# Painel Pessoal de Trabalho - Versão 2

Projeto web simples para rotina de trabalho.

## O que vem nessa versão

- Login
- Nome da pessoa logada no topo
- Painel inicial com contadores
- Anotações
- Frases prontas com atalhos por comando, exemplo: /teste
- Edição de frases prontas
- Mensagens rápidas
- Links importantes
- Escala via Google Sheets iframe
- Calendário
- Registro de eventos
- Timer de prazos
- Configurações

## Rodar localmente

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:5173
```

## Login de teste sem Supabase

```text
Nome: Seu nome
Email: admin@teste.com
Senha: 123456
```

Nesse modo, os dados ficam salvos apenas no navegador.

## Usar Supabase

1. Crie um projeto no Supabase.
2. Copie a URL e a anon key.
3. Crie um arquivo `.env` na raiz do projeto.
4. Cole:

```env
VITE_SUPABASE_URL=SUA_URL
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

5. Rode o conteúdo de `supabase.sql` no SQL Editor do Supabase.
6. Reinicie:

```bash
npm run dev
```

## Google Sheets iframe

No Google Sheets:

1. Arquivo
2. Compartilhar
3. Publicar na Web
4. Incorporar
5. Copie o iframe
6. Cole em Configurações
