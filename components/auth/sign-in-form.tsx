"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/lib/validations";

type SignInValues = {
  email: string;
  password: string;
};

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onChange"
  });

  function onSubmit(values: SignInValues) {
    setErrorMessage("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false
      });

      if (result?.error) {
        setErrorMessage("Correo o contrasena incorrectos. Verifica los datos e intenta de nuevo.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Ingresar al ERP</CardTitle>
        <CardDescription>Accede con tu perfil ADMIN, CAJERO o BODEGUERO.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo</label>
            <Input {...register("email")} type="email" placeholder="admin@repuestospro.com" />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contrasena</label>
            <Input {...register("password")} type="password" placeholder="••••••••" />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            Entrar al sistema
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
