"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./landing.module.css";

export default function LandingPage() {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOkMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.from("demo_requests").insert([
        {
          nome,
          empresa,
          email,
          telefone,
          source: "landing",
        },
      ]);

      if (error) throw error;

      setOkMsg(
        "Pedido enviado! Vamos responder por email com horários para a demo."
      );
      setNome("");
      setEmpresa("");
      setEmail("");
      setTelefone("");
    } catch (err: any) {
      console.error(err);
      setErro(
        "Não foi possível enviar o pedido agora. Tenta novamente dentro de alguns minutos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* NAVBAR */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.logoGroup}>
            <div className={styles.logoMark}>C</div>
            <span className={styles.logoText}>CampusMarket</span>
          </div>

          <nav className={styles.navLinks}>
            <a href="#como-funciona" className={styles.navLink}>
              Como funciona
            </a>
            <a href="#para-quem" className={styles.navLink}>
              Para quem
            </a>
            <a href="#beneficios" className={styles.navLink}>
              Benefícios ESG
            </a>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginLink}>
              Entrar
            </Link>
            <a href="https://calendar.app.google/fHfnMZP4LKXz8RUa8" className={styles.demoButton}>
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={styles.heroSection}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <p className={styles.heroTag}>
                Marketplace circular privado para universidades & empresas
              </p>
              <h1 className={styles.heroTitle}>
                Um marketplace{" "}
                <span className={styles.heroHighlight}>
                  seguro e sustentável
                </span>{" "}
                para a tua comunidade interna.
              </h1>
              <p className={styles.heroSubtitle}>
                CampusMarket é um marketplace privado, com login institucional,
                onde colaboradores e alunos podem vender, doar, trocar ou alugar
                itens entre si – com moderação e métricas de impacto ESG para a
                gestão.
              </p>

              <div className={styles.heroCtas}>
                <a href="#beneficios" className={styles.primaryCta}>
                  Ver benefícios para a organização
                </a>
                <a href="#como-funciona" className={styles.secondaryCta}>
                  Ver como funciona
                </a>
              </div>

              <ul className={styles.heroBullets}>
                <li>• Acesso restrito com e-mail institucional / SSO.</li>
                <li>
                  • Painel para admins com controlo de utilizadores, anúncios e
                  impacto.
                </li>
                <li>• White-label: logo, cores e subdomínio da tua casa.</li>
              </ul>
            </div>

            <div className={styles.heroMock}>
              <div className={styles.mockWindow}>
                <div className={styles.mockTopBar}>
                  <div className={styles.mockDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={styles.mockPill} />
                </div>

                <div className={styles.mockContent}>
                  <div className={styles.mockHeaderRow}>
                    <span className={styles.mockTitle}>Anúncios internos</span>
                    <span className={styles.mockBadge}>ambiente seguro</span>
                  </div>

                  <div className={styles.mockGrid}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={styles.mockCard}>
                        <div className={styles.mockImage}>📦</div>
                        <div className={styles.mockLine} />
                        <div className={styles.mockInfoRow}>
                          <span>venda • usado</span>
                          <span className={styles.mockPrice}>€ 25</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.mockImpactBox}>
                    <div className={styles.mockImpactHeader}>
                      <span>Impacto do mês</span>
                      <span className={styles.mockImpactTag}>ESG</span>
                    </div>
                    <div className={styles.mockImpactStats}>
                      <div>
                        <p className={styles.mockStatLabel}>
                          itens reutilizados
                        </p>
                        <p className={styles.mockStatValue}>482</p>
                      </div>
                      <div>
                        <p className={styles.mockStatLabel}>
                          CO₂ evitado (estim.)
                        </p>
                        <p className={styles.mockStatValueHighlight}>2,4 t</p>
                      </div>
                    </div>
                    <div className={styles.mockBarOuter}>
                      <div className={styles.mockBarInner} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className={styles.section}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader}>
              <h2>Como o CampusMarket funciona na prática</h2>
              <p>
                Em poucas semanas a tua organização pode ter um marketplace
                interno pronto, com regras definidas e métricas de impacto.
              </p>
            </header>

            <div className={styles.cardsGrid}>
              <div className={styles.card}>
                <div className={styles.cardBadge}>1</div>
                <h3>Onboarding & configuração</h3>
                <p>
                  Definimos regras de uso, categorias permitidas, branding e
                  subdomínio (ex.: market.suaempresa.pt).
                </p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardBadge}>2</div>
                <h3>Ativação dos utilizadores</h3>
                <p>
                  Login com e-mail institucional ou SSO. Tudo acontece dentro da
                  comunidade, sem perfis anónimos.
                </p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardBadge}>3</div>
                <h3>Moderação & relatórios</h3>
                <p>
                  Admins acompanham anúncios, denúncias e indicadores de uso e
                  impacto ESG em tempo real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PARA QUEM */}
        <section id="para-quem" className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeaderCenter}>
              <h2>Para quem o CampusMarket foi pensado?</h2>
              <p>Uma solução única, com valor diferente para cada perfil.</p>
            </header>

            <div className={styles.cardsGrid}>
              <div className={styles.cardAlt}>
                <span className={styles.smallBadge}>ESG & reputação</span>
                <h3>Gestores / Reitoria</h3>
                <p>
                  Visão de impacto, controlo de riscos, relato ESG e
                  engajamento da comunidade.
                </p>
              </div>
              <div className={styles.cardAlt}>
                <span className={styles.smallBadge}>Segurança</span>
                <h3>TI & Segurança</h3>
                <p>
                  Acesso controlado, SSO, dados em ambiente seguro e nenhum grupo
                  “pirata” no WhatsApp.
                </p>
              </div>
              <div className={styles.cardAlt}>
                <span className={styles.smallBadge}>Benefício real</span>
                <h3>Colaboradores & alunos</h3>
                <p>
                  Compra e venda com pessoas conhecidas, num ambiente seguro e
                  moderado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS ESG */}
        <section id="beneficios" className={styles.section}>
          <div className={styles.sectionInnerSplit}>
            <div className={styles.esgText}>
              <h2>Benefícios ESG que saem do slide e vão para a prática</h2>
              <p>
                O CampusMarket gera dados concretos que podem ser ligados ao
                relatório de sustentabilidade da organização.
              </p>

              <div className={styles.esgStatsGrid}>
                <div className={styles.esgCard}>
                  <p className={styles.esgLabel}>itens desviados do lixo*</p>
                  <p className={styles.esgValue}>2–5k</p>
                </div>
                <div className={styles.esgCard}>
                  <p className={styles.esgLabel}>CO₂ evitado / ano (estim.)</p>
                  <p className={styles.esgValue}>5–12 t</p>
                </div>
                <div className={styles.esgCard}>
                  <p className={styles.esgLabel}>% comunidade ativa</p>
                  <p className={styles.esgValue}>10–20%</p>
                </div>
                <div className={styles.esgCard}>
                  <p className={styles.esgLabel}>satisfação dos utilizadores</p>
                  <p className={styles.esgValue}>4.7/5</p>
                </div>
              </div>

              <p className={styles.esgFootnote}>
                *Valores de referência baseados em comunidades entre 1.000 e
                10.000 pessoas, com adesão média de 10–15%.
              </p>
            </div>

            <aside className={styles.esgAside}>
              <p className={styles.esgAsideLabel}>Em resumo</p>
              <h3>
                Uma peça pequena que conversa com o puzzle inteiro de ESG.
              </h3>
              <p className={styles.esgAsideText}>
                • Canal oficial (em vez de grupos soltos no WhatsApp). <br />
                • Métricas ligadas a resíduos, CO₂ e engajamento. <br />
                • Benefício concreto para colaboradores e estudantes.
              </p>
              <a href="#contato" className={styles.esgAsideCta}>
                Quero ver um exemplo de relatório ESG
              </a>
            </aside>
          </div>
        </section>

        {/* CONTATO */}
        <section id="contato" className={styles.contactSection}>
          <div className={styles.contactInner}>
            <h2>Vamos testar o CampusMarket na tua organização?</h2>
            <p>
              Deixa os teus dados e marcamos uma demo rápida de 15 minutos para
              perceber se faz sentido para a tua realidade.
            </p>

            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nome"
                  className={styles.contactInput}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  type="text"
                  required
                  placeholder="Empresa/Universidade"
                  className={styles.contactInput}
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  className={styles.contactInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  required
                  placeholder="Contato"
                  className={styles.contactInput}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.contactButton}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Solicitar demo"}
              </button>
            </form>

            {okMsg && <p className={styles.contactSuccess}>{okMsg}</p>}
            {erro && <p className={styles.contactError}>{erro}</p>}

            <footer className={styles.footer}>
              <p>
                © {new Date().getFullYear()} CampusMarket. Todos os direitos
                reservados.
              </p>
              <div className={styles.footerLinks}>
                <a href="#">Privacidade</a>
                <a href="#">Termos</a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
