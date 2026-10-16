import { message, useLocale } from '../i18n';
import { AppearancePreferences } from '../components/AppearancePreferences';
import {
  Bike,
  Building2,
  Check,
  Clock3,
  History,
  Instagram,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  Route,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ContactForm } from '../components/ContactForm';
import { businessConfig, BusinessContact } from '../config/business';

const getNavItems = () => ([
  ['/', message("site.inicio")],
  ['/servicos', message("site.servicos")],
  ['/como-funciona', message("site.como.funciona")],
  ['/para-empresas', message("site.para.clientes")],
  ['/contato', message("site.contato")],
]);

const getBenefits = () => ([
  {
    icon: Route,
    title: message("site.operacao.organizada"),
    text: message("site.entregas.designacoes.e.status.reunidos.no.sistema.operacional.da.js."),
  },
  {
    icon: LockKeyhole,
    title: message("site.acesso.por.perfil"),
    text: message("site.proprietario.entregadores.e.clientes.acessam.apenas.as.informacoes.a"),
  },
  {
    icon: History,
    title: message("site.historico"),
    text: message("site.as.mudancas.de.status.ficam.registradas.para.consulta.no.sistema"),
  },
  {
    icon: UserRoundCheck,
    title: message("site.contato.direto"),
    text: message("site.a.contratacao.comeca.por.uma.solicitacao.de.contato.enviada.para.a.j"),
  },
]);

const getServices = () => ([
  {
    icon: Bike,
    title: message("site.coleta.e.entrega"),
    text: message("site.operacao.de.entregas.conforme.a.necessidade.analisada.e.confirmada.p"),
  },
  {
    icon: Building2,
    title: message("site.atendimento.a.clientes"),
    text: message("site.pessoas.e.empresas.contratantes.podem.receber.acesso.protegido.aos.p"),
  },
  {
    icon: PackageCheck,
    title: message("site.acompanhamento.operacional"),
    text: message("site.o.sistema.registra.responsavel.andamento.e.historico.das.entregas.ca"),
  },
]);

const getSteps = () => ([
  [message("site.contato"), message("site.envie.a.necessidade.pelo.formulario.disponivel.neste.site")],
  [message("site.analise"), message("site.a.js.boy.avalia.as.informacoes.e.combina.as.condicoes.diretamente.co")],
  [message("landing.cadastro"), message("site.quando.aprovado.o.proprietario.cria.o.cliente.e.o.acesso.protegido")],
  [message("site.operacao"), message("site.as.entregas.contratadas.passam.a.ser.acompanhadas.no.sistema")],
]);

function contactIcon(contact: BusinessContact) {
  if (contact.label === 'WhatsApp') return <MessageCircle size={18} aria-hidden="true" />;
  if (contact.label === 'E-mail') return <Mail size={18} aria-hidden="true" />;
  if (contact.label === 'Instagram') return <Instagram size={18} aria-hidden="true" />;
  return <Phone size={18} aria-hidden="true" />;
}

function configuredContacts() {
  return [
    businessConfig.phone,
    businessConfig.whatsapp,
    businessConfig.email,
    businessConfig.instagram,
  ].filter((contact): contact is BusinessContact => Boolean(contact));
}

export function Brand() {
  useLocale();
  return (
    <Link className="siteBrand" to="/" aria-label={message("site.js.boy.inicio")}>
      <span className="siteBrandMark">
        <img src="/assets/js-boy-logo-oficial.jpg" alt="" aria-hidden="true" />
      </span>
      <span>
        <strong>JS BOY</strong>
        <small>{message("site.entregas")}</small>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const locale = useLocale();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const titles: Record<string, string> = {
      '/login': 'login.acesso.a.js.boy',
      '/cadastro': 'cliente.cadastro.criar.conta.como.cliente',
      '/esqueci-senha': 'senha.recuperar.recuperar.senha',
      '/redefinir-senha': 'senha.redefinir.redefinir.senha',
    };
    if (titles[pathname]) document.title = `${message(titles[pathname])} | JS Boy`;
  }, [pathname, locale]);

  return (
    <header className="siteHeader">
      <div className="siteContainer siteHeaderInner">
        <Brand />
        <nav className={menuOpen ? 'siteNav mobileOpen' : 'siteNav'} id="site-navigation" aria-label={message("site.navegacao.do.site")}>
          {getNavItems().map(([to, label]) => (
            <NavLink
              className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}
              end={to === '/'}
              to={to}
              key={to}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="siteActions">
          <AppearancePreferences />
          <Link className="siteGhostButton" to="/contato">{message("site.solicitar.contato")}</Link>
          <Link className="siteYellowButton small" to="/login">{message("site.entrar")}</Link>
        </div>
        <button
          className="siteMenuButton"
          type="button"
          aria-label={menuOpen ? message("site.fechar.menu") : message("site.abrir.menu")}
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  useLocale();
  const contacts = configuredContacts();

  return (
    <footer className="siteFooter">
      <div className="siteContainer footerGrid">
        <div>
          <Brand />
          <p>{message("site.operacao.de.entregas.da.js.boy")}</p>
        </div>
        <div>
          <h3>{message("site.navegacao")}</h3>
          {getNavItems().map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>
        <div>
          <h3>{message("site.acesso")}</h3>
          <Link to="/login">{message("site.entrar.no.sistema")}</Link>
          <Link to="/contato">{message("site.solicitar.contato")}</Link>
          <Link to="/politica-de-privacidade">{message("site.politica.de.privacidade")}</Link>
        </div>
        <div>
          <h3>{message("site.contato")}</h3>
          {contacts.length === 0 ? (
            <Link to="/contato">{message("site.formulario.de.contato")}</Link>
          ) : contacts.map((contact) => (
            <a key={contact.label} href={contact.href} target={contact.href?.startsWith('https://') ? '_blank' : undefined} rel="noreferrer">
              {contactIcon(contact)} {contact.value}
            </a>
          ))}
        </div>
      </div>
      <div className="siteCopyright">© {new Date().getFullYear()} JS Boy. <img src="/assets/js-boy-logo-oficial.jpg" alt="" aria-hidden="true" /></div>
    </footer>
  );
}

export function PublicLayout() {
  const locale = useLocale();
  const whatsapp = businessConfig.whatsapp;
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const pages: Record<string, [string, string]> = {
      '/': [message("site.js.boy.entregas.empresariais"), message("site.gestao.de.entregas.empresariais.com.acompanhamento.pix.direto.e.cont")],
      '/servicos': [message("site.servicos.de.entrega.js.boy"), message("site.conheca.os.servicos.de.coleta.entrega.e.acompanhamento.operacional.d")],
      '/como-funciona': [message("site.como.funciona.js.boy"), message("site.entenda.como.contratar.e.acompanhar.entregas.com.a.js.boy")],
      '/para-empresas': [message("site.solucoes.para.clientes.js.boy"), message("site.operacao.de.entregas.para.pessoas.e.empresas.com.acesso.protegido")],
      '/contato': [message("site.contato.js.boy"), message("site.fale.com.a.js.boy.e.solicite.uma.avaliacao.da.sua.necessidade.de.ent")],
      '/politica-de-privacidade': [message("site.politica.de.privacidade.js.boy"), message("site.saiba.como.a.js.boy.trata.e.protege.dados.pessoais")],
    };
    const [title, description] = pages[pathname] || pages['/'];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}${pathname}`;
  }, [pathname, locale]);
  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 480);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="sitePage">
      <a className="skipLink" href="#conteudo-principal">{message("site.pular.para.o.conteudo")}</a>
      <PublicHeader />
      <main id="conteudo-principal"><Outlet /></main>
      <SiteFooter />
      {whatsapp?.href ? <a className="floatingAction floatingWhatsapp" href={whatsapp.href} target="_blank" rel="noreferrer" aria-label={message("site.falar.com.a.js.boy.pelo.whatsapp")}><MessageCircle size={22} aria-hidden="true" /></a> : null}
      {showTop ? <button className="floatingAction floatingTop" type="button" aria-label={message("site.voltar.ao.topo")} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>↑</button> : null}
    </div>
  );
}

export function LandingPage() {
  useLocale();
  const whatsapp = businessConfig.whatsapp;

  return (
    <>
      <section className="siteHero">
        <div className="siteContainer siteHeroInner">
          <div className="siteHeroText">
            <span className="sitePill"><Bike size={14} /> JS BOY</span>
            <h1>{message("landing.entregas")} <mark>{message("landing.organizadas")}</mark>{message("site.com.responsabilidade")}</h1>
            <p>
              {message("site.a.js.boy.administra.clientes.entregadores.e.entregas.em.um.sistema.c")} </p>
            <div className="siteHeroActions">
              <Link className="siteYellowButton" to="/contato">{message("site.solicitar.contato")} <span>→</span></Link>
              {whatsapp ? (
                <a className="siteOutlineButton" href={whatsapp.href} target="_blank" rel="noreferrer">
                  <MessageCircle size={17} /> {message("site.whatsapp")} </a>
              ) : null}
            </div>
          </div>
          <div className="siteHeroVisual">
            {whatsapp ? (
              <a className="siteBikeBadge officialLogoLink" href={whatsapp.href} target="_blank" rel="noreferrer" aria-label={message("site.conversar.com.a.js.boy.pelo.whatsapp")}>
                <img src="/assets/js-boy-logo-oficial.jpg" alt={message("site.logo.oficial.da.js.boy.entregas")} />
              </a>
            ) : (
              <div className="siteBikeBadge">
                <img src="/assets/js-boy-logo-oficial.jpg" alt={message("site.logo.oficial.da.js.boy.entregas")} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="siteSection compact">
        <div className="siteContainer">
          <div className="siteSectionTitle centered">
            <h2>{message("site.uma.operacao.clara.para.cada.perfil")}</h2>
            <p>{message("site.o.sistema.apoia.o.trabalho.diario.sem.expor.dados.de.outros.usuarios")}</p>
          </div>
          <div className="benefitGrid">
            {getBenefits().map((benefit, index) => (
              <article className={index === 0 ? 'benefitCard featured' : 'benefitCard'} key={benefit.title}>
                <benefit.icon size={37} />
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteCta />
    </>
  );
}

export function ServicesPage() {
  useLocale();
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>{message("site.servicos")}</h1>
          <p>{message("site.o.escopo.de.cada.entrega.e.confirmado.diretamente.pela.js.boy")}</p>
        </div>
        <div className="servicesGrid">
          {getServices().map((service) => (
            <article className="serviceTile" key={service.title}>
              <span><service.icon size={23} /></span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksPage() {
  useLocale();
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>{message("site.como.funciona")}</h1>
          <p>{message("site.o.cadastro.nao.e.publico.a.js.boy.confirma.cada.novo.acesso")}</p>
        </div>
        <div className="stepsGrid">
          {getSteps().map(([title, text], index) => (
            <article className="stepCard" key={title}>
              <span>{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CompaniesPage() {
  useLocale();
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>{message("site.para.clientes")}</h1>
          <p>{message("site.a.js.boy.atende.pessoas.e.empresas.conforme.avaliacao.da.necessidade")}</p>
        </div>
        <div className="companiesGrid">
          <div>
            <h3>{message("site.antes.de.comecar")}</h3>
            <p>
              {message("site.envie.a.solicitacao.de.contato.o.proprietario.confirma.a.contratacao")} </p>
          </div>
          <div>
            <h3>{message("site.acesso.protegido")}</h3>
            <ul className="advantageList">
              <li><Check size={18} /> {message("site.cadastro.criado.pela.js.boy")}</li>
              <li><Check size={18} /> {message("site.consulta.apenas.das.proprias.entregas")}</li>
              <li><Check size={18} /> {message("site.consulta.dos.proprios.pagamentos")}</li>
            </ul>
          </div>
        </div>
        <div className="companyCta">
          <h3>{message("site.quer.conversar.com.a.js.boy")}</h3>
          <p>{message("site.use.o.formulario.para.informar.sua.necessidade")}</p>
          <Link to="/contato" className="siteYellowButton">{message("site.solicitar.contato")}</Link>
        </div>
      </div>
    </section>
  );
}

export function ContactPage() {
  useLocale();
  const contacts = configuredContacts();

  return (
    <section className="siteSection contactSection publicStandalone">
      <div className="siteContainer contactGrid">
        <div>
          <div className="siteSectionTitle">
            <h1>{message("site.fale.com.a.js.boy")}</h1>
            <p>{message("site.envie.uma.solicitacao.para.a.equipe.avaliar.sua.necessidade")}</p>
          </div>
          <div className="contactList">
            {contacts.map((contact) => (
              <article key={contact.label}>
                {contactIcon(contact)}
                <span>{contact.label.toUpperCase()}</span>
                <strong>
                  <a href={contact.href} target={contact.href?.startsWith('https://') ? '_blank' : undefined} rel="noreferrer">
                    {contact.value}
                  </a>
                </strong>
              </article>
            ))}
            {businessConfig.city ? (
              <article><MapPin size={23} /><span>{message("landing.cidade")}</span><strong>{businessConfig.city}</strong></article>
            ) : null}
            {businessConfig.hours ? (
              <article><Clock3 size={23} /><span>{message("site.horario")}</span><strong>{businessConfig.hours}</strong></article>
            ) : null}
            {contacts.length === 0 && !businessConfig.city && !businessConfig.hours ? (
              <p className="contactFallback">{message("site.o.formulario.ao.lado.e.o.canal.de.contato.disponivel")}</p>
            ) : null}
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

function SiteCta() {
  useLocale();
  return (
    <section className="siteCta">
      <div className="siteContainer">
        <h2>{message("site.precisa.conversar.sobre.uma.entrega")}</h2>
        <p>{message("site.envie.as.informacoes.para.a.js.boy.analisar")}</p>
        <div className="siteCtaActions">
          <Link to="/contato">{message("site.solicitar.contato")}</Link>
          <Link to="/login">{message("site.ja.tenho.acesso")}</Link>
        </div>
      </div>
    </section>
  );
}
