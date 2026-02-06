import {z} from 'zod'
import validator from 'validator'

export const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6, "Password skal mindst være 6 karakterer"),
    membershipId: z.coerce.number({
      required_error: "Vælg venligst et medlemsskab",
      invalid_type_error: ""
    })
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

export const assetsSchema = z.object({
  url: z.string().url(),
  altText: z.string(),
  width: z.number(),
  height: z.number(),
})

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  area: z.string(),
  createdAt: z.string(),
  asset: assetsSchema,
})

export const employeeResSchema = z.object({
  success: z.boolean(),
  data: z.array(employeeSchema)
})

export const exercisesResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(exerciseSchema)
});

export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  teaser: z.string(),
  content: z.string(),
  author: z.string(),
  createdAt: z.string().datetime(), 
  updatedAt: z.string(),
  asset: assetsSchema,
});

export const postResSchema = z.object({
  success: z.boolean(),
  data: z.array(postSchema),
});