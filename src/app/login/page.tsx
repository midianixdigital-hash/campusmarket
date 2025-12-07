"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  // 🔒 Modo cadastro desativado.
  // Mantive o state comentado para poderes reativar depois, se quiseres.
  // const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // // Dados de perfil (só usados no cadastro) – desativados
  // const [nome, setNome] = useState("");
  // const [departamento, setDepartamento] = useState("");
  // const [contacto, setcontacto] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setInfo(null);
    setLoading(true);

    try {
      // ✅ Apenas login. A parte de signup foi comentada abaixo.
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      return;

      /*
      // --------- SIGNUP DESATIVADO ---------
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        return;
      }

      // cadastro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          nome: nome || null,
          departamento: departamento || null,
          contacto: contacto || null,
        });

        if (profileError) {
          console.error(profileError);
        }
      }

      setInfo(
        "Conta criada com sucesso. Se o projeto exigir confirmação por email, verifica a caixa de entrada."
      );
      setMode("login");
      // --------- FIM SIGNUP DESATIVADO ---------
      */
    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.brand}>
            <div className={styles.logoMark}>C</div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>CampusMarket</span>
              <span className={styles.brandSubtitle}>
                Acesso à comunidade interna
              </span>
            </div>
          </div>

          <Link href="/landing" className={styles.backLink}>
            ← Ver página inicial
          </Link>
        </div>

        {/* Título fixo em "Entrar" */}
        <h2 className={styles.title}>Entrar</h2>

        {/* Tabs de Login / Criar conta – desativadas */}
        {/*
        <div className={styles.tabs}>
          <button
            type="button"
            className={
              mode === "login" ? styles.tabButtonActive : styles.tabButton
            }
            onClick={() => {
              setMode("login");
              setErro(null);
              setInfo(null);
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={
              mode === "signup" ? styles.tabButtonActive : styles.tabButton
            }
            onClick={() => {
              setMode("signup");
              setErro(null);
              setInfo(null);
            }}
          >
            Criar conta
          </button>
        </div>
        */}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email institucional
            </label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Campos extra de cadastro – desativados */}
          {/*
          {mode === "signup" && (
            <>
              <div className={styles.field}>
                <label htmlFor="nome" className={styles.label}>
                  Nome
                </label>
                <input
                  id="nome"
                  className={styles.input}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="departamento" className={styles.label}>
                  Departamento / setor
                </label>
                <input
                  id="departamento"
                  className={styles.input}
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contacto" className={styles.label}>
                  Contacto / WhatsApp
                </label>
                <input
                  id="contacto"
                  className={styles.input}
                  value={contacto}
                  onChange={(e) => setcontacto(e.target.value)}
                />
              </div>
            </>
          )}
          */}

          <button
            type="submit"
            className={
              loading ? `${styles.button} ${styles.buttonDisabled}` : styles.button
            }
            disabled={loading}
          >
            {loading ? "Aguarde..." : "Entrar"}
          </button>

          {erro && <p className={styles.error}>{erro}</p>}
          {info && <p className={styles.info}>{info}</p>}

          <p className={styles.hint}>
            O acesso é exclusivo para pessoas da organização. As contas são
            criadas pela equipa interna / administrador do CampusMarket.
          </p>
        </form>
      </div>
    </div>
  );
}
