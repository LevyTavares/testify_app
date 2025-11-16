# Testify App (Front-end)

Aplicativo mobile/web construído com Expo + React Native e Expo Router. Ele gerencia modelos (templates), correções e relatórios, com persistência local via SQLite.

## Visão geral

- Framework: Expo SDK 54 (React Native 0.81, React 19)
- Navegação: Expo Router (arquivos em `app/`)
- UI: React Native Paper e ícones `@expo/vector-icons`
- Persistência local: `expo-sqlite` (banco embarcado no dispositivo)
- Mídia/arquivos: `expo-media-library`, `expo-file-system`

## Pré‑requisitos

- Node.js 18 LTS ou 20 LTS
- NPM 9+ (ou 10+) – o projeto usa `package-lock.json`
- Android Studio (emulador) e/ou Xcode (iOS) se quiser rodar em simulador; ou o app Expo Go no dispositivo físico

> Dica: não é necessário ter o CLI global do Expo. Todos os scripts usam a instalação local (dependency `expo`).

## Como rodar (primeira vez)

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o Metro bundler (escolha o alvo):

   ```bash
   # Inicia o Dev Server e abre o menu do Expo
   npm run start

   # Ou abra direto em um alvo específico
   npm run android
   npm run ios
   npm run web
   ```

3. Para Android/iOS, conecte um emulador ou leia o QR Code no app Expo Go.

## Scripts disponíveis

Os scripts estão definidos no `package.json`:

- `npm run start` – inicia o projeto no Expo
- `npm run android` – inicia já apontando para Android
- `npm run ios` – inicia já apontando para iOS
- `npm run web` – inicia no navegador (bundler: Metro)

Opcional:

- Verificar tipos TypeScript sem emitir JS:

  ```bash
  npx tsc -p tsconfig.json --noEmit
  ```

## Estrutura do projeto

```
testify_app/
	app/                 # Rotas e telas (Expo Router)
		_layout.tsx       # Layout raiz das rotas
		index.tsx         # Tela inicial
		createTemplate.tsx
		corrector.tsx
		reports.tsx
		modal.tsx
	assets/              # Imagens e fontes
	components/          # Componentes reutilizáveis
	constants/           # Cores, temas, etc.
	context/             # Contextos (ex.: TemplateContext)
	db/                  # Acesso ao SQLite
	types/               # Tipos/declarações TS
	app.json             # Configuração do Expo (nome, ícones, permissões...)
	metro.config.js      # Config do Metro bundler
	package.json         # Scripts e dependências
	tsconfig.json        # Config do TypeScript
```

## Variáveis de ambiente (opcional)

Para expor variáveis no cliente com Expo 54, use o prefixo `EXPO_PUBLIC_` no arquivo `.env` (não versionado):

```
# .env (exemplo)
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
```

Uso no código:

```ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

> Observação: o `.gitignore` já ignora `.env` e `.env.*`.

## Banco de dados local (SQLite)

O app usa `expo-sqlite` para persistir dados locais (ver `db/database.ts`). O SQLite armazena o arquivo de banco no sandbox do app. Em ambiente web o SQLite funciona com fallback (IndexedDB); valide suas necessidades no navegador alvo.

## Integração com o back‑end

O back‑end (FastAPI) está na pasta `../testify_backend` e agora retorna URLs do Cloudinary ao gerar gabaritos.

- `POST /generate_gabarito`
	- Body (JSON): `{ "tituloProva": "Teste", "numQuestoes": 10 }`
	- Resposta (JSON): `{ "image_path": "https://.../gabarito.png", "map_path": "https://.../map.json" }`

No front, `app/createTemplate.tsx` foi atualizado:

- O `handleSaveTemplate` usa `response.json()` e lê `image_path` e `map_path` (em vez de `blob()` e header `X-Map-Path`).
- As URLs são salvas no SQLite via `handleAddTemplate(...)`.
- A prévia usa diretamente `image_path` (HTTPS), e o botão “Baixar Gabarito (PNG)” agora também baixa a URL remota para arquivo temporário antes de salvar/compartilhar.

Para apontar o app ao backend, configure a URL base no `.env` via `EXPO_PUBLIC_API_URL`.

## Build para produção

Para gerar binários nativos, recomenda‑se usar EAS Build:

1. Instale o CLI (global): `npm i -g eas-cli`
2. Faça login: `eas login`
3. Configure: `eas init`
4. Rode: `eas build -p android` ou `eas build -p ios`

Para web estática, veja em `app.json` a configuração `web.output: "static"`. Você pode exportar com:

```bash
npx expo export --platform web
```

## Dicas de desenvolvimento

- Limpar cache do Expo: `npx expo start -c`
- Erros de tipagem: rode o verificador de tipos (seção Scripts)
- Imagens/ícones: os caminhos estão definidos em `app.json` (splash, icon, adaptive icon)
- Permissões Android: estão listadas em `app.json > android.permissions`

## Problemas comuns

- "Device/Emulator não abre": verifique se o emulador está rodando antes de executar `npm run android/ios`.
- "Porta ocupada": pare processos anteriores do Metro bundler ou use `CTRL+C` e reinicie com `npm run start`.
- "Variáveis não carregam": garanta o prefixo `EXPO_PUBLIC_` e reinicie o Dev Server.
- "Baixar imagem não funciona": verifique se a prévia é uma URL HTTPS; o app baixa a imagem do Cloudinary antes de salvar. Caso falhe, confira conectividade e permissões da `expo-media-library`.

---

Mantenha este README atualizado conforme novas telas, fluxos e integrações forem adicionadas.
