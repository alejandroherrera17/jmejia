"use client";

import { startTransition } from "react";
import { Role } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createUserAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserSchema } from "@/lib/validations";

type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export function UserForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: Role.CAJERO
    },
    mode: "onChange"
  });

  function onSubmit(values: UserFormValues) {
    startTransition(async () => {
      await createUserAction(values);
      reset({
        role: Role.CAJERO,
        name: "",
        email: "",
        password: ""
      });
      toast.success("Usuario creado correctamente.");
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register("name")} placeholder="Juan Perez" />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Correo</label>
        <Input {...register("email")} type="email" placeholder="usuario@repuestospro.com" />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Contrasena temporal</label>
        <Input {...register("password")} type="password" placeholder="Minimo 6 caracteres" />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rol</label>
        <select
          {...register("role")}
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
        >
          <option value={Role.CAJERO}>CAJERO</option>
          <option value={Role.BODEGUERO}>BODEGUERO</option>
          <option value={Role.ADMIN}>ADMIN</option>
        </select>
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        Crear usuario
      </Button>
    </form>
  );
}
