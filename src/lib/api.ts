import * as R from 'ramda';
import { z } from 'zod';
import validator from 'validator'

const BASE_URL = 'http://localhost:4000';

// fetch, Standard currying
const sendRequest = R.curry(async (accessToken: string | null, method: string, path: string, body: any = null) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return {};
  return response.json();
});

const wrapSafe = <T>(fn: () => Promise<T>, fallback: T): Promise<T> => 
  fn().catch((err) => {
    console.error("API Error:", err.message);
    return fallback;
  });

// Public Methods
export const publicGet = (path: string) => sendRequest(null, 'GET', path, null);
export const publicPost = (path: string, body: any) => sendRequest(null, 'POST', path, body);

// Secure Methods
export const secureGet = (accessToken: string, path: string) => sendRequest(accessToken, 'GET', path, null);
export const securePost = (accessToken: string, path: string, body: any) => sendRequest(accessToken, 'POST', path, body);

// Schemas
export const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

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

export const authRes = z.object({
    accessToken: z.string().optional(), //allows empty response like for registering
}).passthrough();

export const exerciseSchema = z.object({
    id: z.number(),
    title: z.string(),
    teaser: z.string(),
    content: z.string(),
    asset: z.object({
        url: z.string(),
        altText: z.string(),
        width: z.number(),
        height: z.number()
    })
});

export const exercisesResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(exerciseSchema)
});

// API Logic 
export const registerUser = async (formData: any) => {
    const data = await publicPost('auth/register', formData);
    return authRes.parse(data);
};

export const loginUser = async (credentials: any) => {
    const data = await publicPost('auth/login', credentials);
    const safeData = R.isEmpty(data) ? {accessToken: undefined} : data;
    return R.tryCatch(
      (d: any) => authRes.parse(d),
      R.always(null)
    )(safeData);
};

export const getMyProfile = async (token: string) => {
    const data = await secureGet(token, 'users/me');
    const safeData = R.isEmpty(data) ? {accessToken: undefined} : data;
    return R.tryCatch(
        (d: any) => userSchema.parse(d),
        R.always(null)
    )(safeData);
};

export const submitContactForm = async (formData: any) => {
  const validated = contactSchema.parse(formData);
   const data = await publicPost('messages', validated);
  console.log("Contact form submitted:", data);
  return data;
};

//helpers 
export interface ApiResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

const formatZodError = (err: any) => {
    console.error("Technical Debug Info:", err); 

    return {
        success: false,
        message: err instanceof z.ZodError 
            ? R.pipe(
                (e: z.ZodError) => e.errors, 
                R.map((error: any) => error.message), 
                R.join(" | ")
              )(err)
            : `Server Error: ${err.message}`
    };
};

// Safe Exports
export const logOut = () => {
  sessionStorage.removeItem('auth_token');
  window.location.href = '/login';
}
export const safeGetMyProfile = (token: string) => wrapSafe(() => getMyProfile(token), null);
export const safeSubmitContact = async (formData: any): Promise<ApiResponse> => {
    return Promise.resolve(formData)
    .then(data => contactSchema.parse(data))
    .then(submitContactForm)
    .then(res => R.mergeRight({ success: true }, res))
    .catch(formatZodError);
};


export const safeRegister = (formData: any): Promise<ApiResponse> => {
  return Promise.resolve(formData)
    .then(data => userSchema.parse(data))
    .then(registerUser)
    .then(res => R.mergeRight({ success: true}, res))
    .catch(formatZodError);
}

export const safeLogin = (credentials: any): Promise<ApiResponse> => 
  loginUser(credentials)
    .then(data => {
      if (data?.accessToken) {
        sessionStorage.setItem('auth_token', data.accessToken);
        return { success: true, message: "Login successful", ...data };
      }
      return { success: false, message: "Server didn't provide a session token" };
    })
    .catch(err => ({ 
      success: false, 
      message: "Login error, is your email and password correct?" 
    }));

export const safeGetExercises = async () => {
    const response = await publicGet('exercises');
    const validated = exercisesResponseSchema.parse(response);
    return validated.data;
};