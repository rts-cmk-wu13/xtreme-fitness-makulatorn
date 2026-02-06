## Sasha Friis - WU13 - xtreme fitness svendeprøve

## Start af projektet
For at køre projektet lokalt:
```bash
npm install
npm run dev
```
Forsiden ligger på URL adressen:
http://localhost:4321/

## Login 
email: eksamen@email.dk
password: Eksamen123

## Tech stack 
### Astro
- Astro er et content-driven, performance-first framework
- Det er statisk, alt HTML bliver rendered server-side, er godt for SEO og mobil brugere
- UI-agnostisk, støtter både react, vue, svelte, HTMX, web components, m.m.
- "Zero JS, by default" - mindre client-side javascript 
- Slipper for kompleksiteten ved router-hooks og "stale closures", som man ofte ser i Single Page Applications (f.eks. React).
- Kan lave fil baseret komponenter på samme måde som svelte, så jeg ikke behover at bruge et UI framework henover for at kunne lave componenter
- Alt styling og client-side JS/TS er lokaliseret i hvert individuelle komponent, gør det nemmere at vedligeholde koden samt holder alt funtionalitet og styling i selve komponentet

### Ramda.js
- JS bibliotek der tilføjer pure functional programming koncepter og renere databehandling
- JS er ofte imperativt skrevet (fortæller hvordan funktionerne skal gøre) imens ramda.js og functional programming er deklarativt (hvad jeg vil opnå)
- En curried funktion behøver ikke alle argumenter på en gang, giv den en og den returnerer en ny funktion der venter på resten. Er brugt til at give et mere 
genbrueligt og modulart API lag
```typescript
// Den curriede basis-funktion
const sendRequest = R.curry(async (token: string | null, method: string, path: string, body: any = null) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(`${BASE_URL}/${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  return response.status === 204 ? {} : response.json();
});
```
- Er brugbart til at lave "specialiserede" versioner af fks. et fetch, uden at skrive base logikken hver gang
```typescript
// Specialiserede versioner skabt via partial application
export const publicPost = (path: string, body: any) => sendRequest(null, 'POST', path, body);
// Samme koncept, men med en accessToken 
export const secureGet = (accessToken: string, path: string) => sendRequest(accessToken, 'GET', path, null);
```
- I min fejlhåndtering benytter jeg R.pipe. Her nævnes dataen ikke direkte (point-free), men flyder igennem en række transformationer.
```typescript
const formatZodError = (err: any) => ({
    success: false,
    message: err instanceof z.ZodError 
        ? R.pipe(
            (e: z.ZodError) => e.errors,      // Hent fejl-array
            R.map((error) => error.message), // Transformer til beskeder
            R.join(" | ")                    // Saml til en string
          )(err)                             
        : "Registration failed."
});
```
- I stedet for en traditionel try/catch blok, bruger jeg R.tryCatch til at håndtere parsing af API-responser. Dette holder koden lineær og lettere at læse.
```typescript
export const loginUser = async (credentials: any) => {
    const data = await publicPost('auth/login', credentials);
    const safeData = R.isEmpty(data) ? { accessToken: undefined } : data;

    // d er input, authRes.parse er success-stien, R.always(null) er failure-stien
    return R.tryCatch(
      (d) => authRes.parse(d),
      R.always(null)
    )(safeData);
};
```
- Stor personlig interesse i functional programming da det giver bedre mening at læse og forstå
```typescript
//Istedet for en imperativ try/catch block, "piper" jeg dataen igennem en serie af transformationer
//.then() tager outputtet fra den forrige function som sin input
export const safeSubmitContact = async (formData: any): Promise<ApiResponse> => {
    return Promise.resolve(formData)
    .then(data => Schemas.contactSchema.parse(data))
    .then(submitContactForm)
    //R.mergeRight sikrer sig jeg ikke muterer respons objektet, men returnerer et nyt object med success:true flag
    .then(res => R.mergeRight({ success: true }, res))
    .catch(formatZodError);
  };

//Eksempel på R.mergeRight fra ramda.js dokumentationen
R.mergeRight({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
//=> { 'name': 'fred', 'age': 40 }
```

### Zod validation
- Definer strukturen af min data før jeg bruger den
- Type-safety
- Kan generere brugervenlige fejlbeskeder direkte fra valideringen.
```typescript
// Definition af schema for kontaktformularen
export const contactSchema = z.object({
    name: z.string().min(1, "Navn skal minimum være 1 karakterer"),
    email: z.string().email("Ugyldig email addresse"),
    phone: z.string()
      .transform((val) => val.replace(/\s+/g, ""))
      .refine((val) => validator.isMobilePhone(val, 'any'), {
          message: "Ugyldigt telefonnummer"
    }),
    message: z.string().min(10, "Besked skal være minimum 10 karakterer langt"),
    subject: z.string().min(5, "Besked skal minimum være 5 karakterer lang"),
});

// Validering af data før det sendes til API'et
export const submitContactForm = async (formData: any) => {
  const validated = Schemas.contactSchema.parse(formData);
   const data = await publicPost('messages', validated);
  console.log("Contact form submitted:", data);
  return data;
};
```

### HTML, CSS, typescript
- Holde det simpelt med ren CSS, HTML og Typescript til at lave sidder og komponenter
- Compiler mindre JS, øger SEO og hastighed

### Tidsplan/vurdering af egen indsats 
I prøve eksamen har jeg gjort en stor del af arbejdet så der var meget kode jeg kunne genbruge, som bare skulle finjusteres så det passede ind i det her projekt. På grund af et sprint på min arbejdsplads som har ligget i samme uge som selve eksamen, har jeg blevet nødt til også at køre sprints i det her projekt , det har resulteret I at jeg har meget få commits og ikke har kunne gøre atomiske PR's som ville have gjort strukturen af hvordan jeg har arbejdet mere tydeligt. Mine PR's har været alt for store, har indeholdt både scripts, flere pages og komponenter, så selvom jeg har nået mere end jeg gjorde til prøve eksamen, så reflekterer min commit historik ikke det arbejde jeg har lagt i opgaven