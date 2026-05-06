# La Quinta Forca 🌍

Benvingut a **La Quinta Forca**, el joc de geografia en català.

---

## 🤖 Manual d'Instal·lació: Bot de Música de La Quinta Forca

Benvingut/da! Per tenir música èpica generada per IA a les teves partides, necessitem instal·lar un petit "robot" al teu ordinador. Aquest robot s'encarregarà d'entrar a Suno i demanar les cançons per tu de forma automàtica.

No pateixis si no saps res d'informàtica. Només hauràs de copiar i enganxar el que et diguem aquí. Busca el teu sistema operatiu i segueix els passos:

### 🪟 1. Guia per a WINDOWS

**Pas 1: Instal·lar el "motor" del robot**
Necessitem instal·lar dos programes bàsics perquè l'ordinador entengui les ordres.
1. Entra a [nodejs.org](https://nodejs.org/) i descarrega el botó verd que diu "LTS". Instal·la'l fent clic a Next (Següent) a tot.
2. Entra a [gitforwindows.org](https://gitforwindows.org/) i descarrega'l. Instal·la'l també fent clic a Next a tot.

**Pas 2: Descarregar el codi (La "pantalla negra")**
1. Al teu teclat, prem la tecla Windows, escriu `cmd` i prem Enter. S'obrirà una finestra negra (Símbol del sistema).
2. Copia aquesta ordre, enganxa-la a la finestra negra i prem Enter (això descarregarà el robot):
   `git clone https://github.com/fortiaarumi/la_quinta_forca.git`
3. Ara, entrarem dins de la carpeta que s'acaba de descarregar. Escriu això i prem Enter:
   `cd la_quinta_forca`
4. Finalment, direm al robot que prepari les seves eines. Escriu això i prem Enter (trigarà un minutet):
   `npm install`

**Pas 3: Configurar el fitxer de claus**
1. Obre el programa **Bloc de Notes** (Notepad) del teu ordinador.
2. **Copia i enganxa** exactament aquest bloc de text tal qual:
   ```text
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386
   NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb
   ```
3. Fes clic a **Fitxer > Anomena i desa**.
4. **Molt important:** A la pestanya "Tipus", canvia "Documents de text (*.txt)" a **"Tots els fitxers"**.
5. Al nom del fitxer, escriu exactament: `.env.local`
6. Guarda aquest fitxer dins de la carpeta on hem descarregat el robot.

**Pas 4: Engegar el robot!**
1. Torna a la finestra negra (`cmd`).
2. Copia, enganxa això i prem Enter:
   `node --env-file=.env.local suno-puppeteer.mjs`
3. Màgia! S'obrirà una finestra nova de Google Chrome tota sola. Inicia sessió amb el teu compte de Suno.com allà dins i llestos. El robot ja està treballant per tu!

---

### 🐧 2. Guia per a LINUX (Ubuntu / Debian)

**Pas 1: Instal·lar el "motor" del robot**
1. Obre la Terminal (pots fer-ho prement `Ctrl + Alt + T`).
2. Enganxa aquesta ordre i prem Enter per instal·lar els programes necessaris (et demanarà la teva contrasenya):
   `sudo apt update && sudo apt install nodejs npm git -y`

**Pas 2: Descarregar el codi**
1. A la mateixa Terminal, enganxa això per descarregar el robot i prem Enter:
   `git clone https://github.com/fortiaarumi/la_quinta_forca.git`
2. Entra a la carpeta escrivint: `cd la_quinta_forca`
3. Prepara les eines escrivint: `npm install`

**Pas 3: Configurar el fitxer de claus**
1. Escriu aquesta ordre per crear el fitxer i prem Enter: `nano .env.local`
2. Enganxa aquest bloc dins de la terminal:
   ```text
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386
   NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb
   ```
3. Per guardar, prem `Ctrl + O`, després `Enter`, i finalment `Ctrl + X`.

**Pas 4: Engegar el robot!**
1. A la mateixa Terminal, enganxa aquesta ordre i prem Enter:
   `node --env-file=.env.local suno-puppeteer.mjs`
2. S'obrirà el navegador Google Chrome automàticament. Només has d'iniciar sessió a Suno.com i deixar que la música comenci!

---

### 🍎 3. Guia per a MAC (Apple)

**Pas 1: Instal·lar el "motor" del robot**
1. Entra a [nodejs.org](https://nodejs.org/) i descarrega el botó verd que diu "LTS". Obre l'arxiu descarregat i instal·la'l normalment.
2. Al teu Mac, prem la tecla `Cmd (⌘) + Espai` per obrir el cercador, escriu `Terminal` i prem Enter.
3. A la finestra blanca que s'obre, escriu `git --version` i prem Enter. Si el teu Mac no el té, et sortirà una finestreta demanant si el vols instal·lar. Digues que sí.

**Pas 2: Descarregar el codi**
1. A la Terminal, enganxa aquesta ordre i prem Enter per descarregar el robot:
   `git clone https://github.com/fortiaarumi/la_quinta_forca.git`
2. Entra a la carpeta que acabem de crear escrivint: `cd la_quinta_forca`
3. Prepara les eines del robot enganxant això i prement Enter (espera uns segons que acabi):
   `npm install`

**Pas 3: Configurar el fitxer de claus**
1. Escriu aquesta ordre a la Terminal i prem Enter: `nano .env.local`
2. Enganxa aquest bloc dins:
   ```text
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386
   NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb
   ```
3. Per guardar-ho, prem `Control + O`, prem `Enter`, i finalment `Control + X`.

**Pas 4: Engegar el robot!**
1. A la mateixa Terminal, enganxa l'ordre definitiva i prem Enter:
   `node --env-file=.env.local suno-puppeteer.mjs`
2. L'ordinador obrirà un navegador Google Chrome sol. Inicia sessió al teu compte de Suno.com en aquesta nova finestra i ja ho tens tot configurat!
