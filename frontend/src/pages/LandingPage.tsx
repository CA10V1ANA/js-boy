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

const navItems = [
  ['/', 'Início'],
  ['/servicos', 'Serviços'],
  ['/como-funciona', 'Como funciona'],
  ['/para-empresas', 'Para clientes'],
  ['/contato', 'Contato'],
];

const benefits = [
  {
    icon: Route,
    title: 'Operação organizada',
    text: 'Entregas, designações e status reunidos no sistema operacional da JS Boy.',
  },
  {
    icon: LockKeyhole,
    title: 'Acesso por perfil',
    text: 'Proprietário, entregadores e clientes acessam apenas as informações autorizadas.',
  },
  {
    icon: History,
    title: 'Histórico',
    text: 'As mudanças de status ficam registradas para consulta no sistema.',
  },
  {
    icon: UserRoundCheck,
    title: 'Contato direto',
    text: 'A contratação começa por uma solicitação de contato enviada para a JS Boy.',
  },
];

const services = [
  {
    icon: Bike,
    title: 'Coleta e entrega',
    text: 'Operação de entregas conforme a necessidade analisada e confirmada pela JS Boy.',
  },
  {
    icon: Building2,
    title: 'Atendimento a clientes',
    text: 'Pessoas e empresas contratantes podem receber acesso protegido aos próprios dados.',
  },
  {
    icon: PackageCheck,
    title: 'Acompanhamento operacional',
    text: 'O sistema registra responsável, andamento e histórico das entregas cadastradas.',
  },
];

const steps = [
  ['Contato', 'Envie a necessidade pelo formulário disponível neste site.'],
  ['Análise', 'A JS Boy avalia as informações e combina as condições diretamente com você.'],
  ['Cadastro', 'Quando aprovado, o proprietário cria o cliente e o acesso protegido.'],
  ['Operação', 'As entregas contratadas passam a ser acompanhadas no sistema.'],
];

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
  return (
    <Link className="siteBrand" to="/" aria-label="JS Boy Início">
      <span className="siteBrandMark">
        <img src="/assets/js-boy-logo-oficial.jpg" alt="" aria-hidden="true" />
      </span>
      <span>
        <strong>JS BOY</strong>
        <small>ENTREGAS</small>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="siteHeader">
      <div className="siteContainer siteHeaderInner">
        <Brand />
        <nav className={menuOpen ? 'siteNav mobileOpen' : 'siteNav'} id="site-navigation" aria-label="Navegação do site">
          {navItems.map(([to, label]) => (
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
          <Link className="siteGhostButton" to="/contato">Solicitar contato</Link>
          <Link className="siteYellowButton small" to="/login">Entrar</Link>
        </div>
        <button
          className="siteMenuButton"
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
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
  const contacts = configuredContacts();

  return (
    <footer className="siteFooter">
      <div className="siteContainer footerGrid">
        <div>
          <Brand />
          <p>Operação de entregas da JS Boy.</p>
        </div>
        <div>
          <h3>Navegação</h3>
          {navItems.map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>
        <div>
          <h3>Acesso</h3>
          <Link to="/login">Entrar no sistema</Link>
          <Link to="/contato">Solicitar contato</Link>
          <Link to="/politica-de-privacidade">Política de Privacidade</Link>
        </div>
        <div>
          <h3>Contato</h3>
          {contacts.length === 0 ? (
            <Link to="/contato">Formulário de contato</Link>
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
  const whatsapp = businessConfig.whatsapp;
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const pages: Record<string, [string, string]> = {
      '/': ['JS BOY - Entregas Empresariais', 'Gestão de entregas empresariais com acompanhamento, Pix direto e controle financeiro.'],
      '/servicos': ['Serviços de entrega | JS BOY', 'Conheça os serviços de coleta, entrega e acompanhamento operacional da JS Boy.'],
      '/como-funciona': ['Como funciona | JS BOY', 'Entenda como contratar e acompanhar entregas com a JS Boy.'],
      '/para-empresas': ['Soluções para clientes | JS BOY', 'Operação de entregas para pessoas e empresas com acesso protegido.'],
      '/contato': ['Contato | JS BOY', 'Fale com a JS Boy e solicite uma avaliação da sua necessidade de entrega.'],
      '/politica-de-privacidade': ['Política de Privacidade | JS BOY', 'Saiba como a JS Boy trata e protege dados pessoais.'],
    };
    const [title, description] = pages[pathname] || pages['/'];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}${pathname}`;
  }, [pathname]);
  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 480);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="sitePage">
      <a className="skipLink" href="#conteudo-principal">Pular para o conteúdo</a>
      <PublicHeader />
      <main id="conteudo-principal"><Outlet /></main>
      <SiteFooter />
      {whatsapp?.href ? <a className="floatingAction floatingWhatsapp" href={whatsapp.href} target="_blank" rel="noreferrer" aria-label="Falar com a JS Boy pelo WhatsApp"><MessageCircle size={22} aria-hidden="true" /></a> : null}
      {showTop ? <button className="floatingAction floatingTop" type="button" aria-label="Voltar ao topo" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>↑</button> : null}
    </div>
  );
}

export function LandingPage() {
  const whatsapp = businessConfig.whatsapp;

  return (
    <>
      <section className="siteHero">
        <div className="siteContainer siteHeroInner">
          <div className="siteHeroText">
            <span className="sitePill"><Bike size={14} /> JS BOY</span>
            <h1>Entregas <mark>organizadas</mark>, com responsabilidade.</h1>
            <p>
              A JS Boy administra clientes, entregadores e entregas em um sistema com acessos separados por perfil.
            </p>
            <div className="siteHeroActions">
              <Link className="siteYellowButton" to="/contato">Solicitar contato <span>→</span></Link>
              {whatsapp ? (
                <a className="siteOutlineButton" href={whatsapp.href} target="_blank" rel="noreferrer">
                  <MessageCircle size={17} /> WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          <div className="siteHeroVisual">
            {whatsapp ? (
              <a className="siteBikeBadge officialLogoLink" href={whatsapp.href} target="_blank" rel="noreferrer" aria-label="Conversar com a JS Boy pelo WhatsApp">
                <img src="/assets/js-boy-logo-oficial.jpg" alt="Logo oficial da JS Boy Entregas" />
              </a>
            ) : (
              <div className="siteBikeBadge">
                <img src="/assets/js-boy-logo-oficial.jpg" alt="Logo oficial da JS Boy Entregas" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="siteSection compact">
        <div className="siteContainer">
          <div className="siteSectionTitle centered">
            <h2>Uma operação clara para cada perfil</h2>
            <p>O sistema apoia o trabalho diário sem expor dados de outros usuários.</p>
          </div>
          <div className="benefitGrid">
            {benefits.map((benefit, index) => (
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
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>Serviços</h1>
          <p>O escopo de cada entrega é confirmado diretamente pela JS Boy.</p>
        </div>
        <div className="servicesGrid">
          {services.map((service) => (
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
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>Como funciona</h1>
          <p>O cadastro não é público: a JS Boy confirma cada novo acesso.</p>
        </div>
        <div className="stepsGrid">
          {steps.map(([title, text], index) => (
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
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer">
        <div className="siteSectionTitle">
          <h1>Para clientes</h1>
          <p>A JS Boy atende pessoas e empresas conforme avaliação da necessidade.</p>
        </div>
        <div className="companiesGrid">
          <div>
            <h3>Antes de começar</h3>
            <p>
              Envie a solicitação de contato. O proprietário confirma a contratação e cria o cadastro quando aplicável.
            </p>
          </div>
          <div>
            <h3>Acesso protegido</h3>
            <ul className="advantageList">
              <li><Check size={18} /> Cadastro criado pela JS Boy</li>
              <li><Check size={18} /> Consulta apenas das próprias entregas</li>
              <li><Check size={18} /> Consulta dos próprios pagamentos</li>
            </ul>
          </div>
        </div>
        <div className="companyCta">
          <h3>Quer conversar com a JS Boy?</h3>
          <p>Use o formulário para informar sua necessidade.</p>
          <Link to="/contato" className="siteYellowButton">Solicitar contato</Link>
        </div>
      </div>
    </section>
  );
}

export function ContactPage() {
  const contacts = configuredContacts();

  return (
    <section className="siteSection contactSection publicStandalone">
      <div className="siteContainer contactGrid">
        <div>
          <div className="siteSectionTitle">
            <h1>Fale com a JS Boy</h1>
            <p>Envie uma solicitação para a equipe avaliar sua necessidade.</p>
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
              <article><MapPin size={23} /><span>CIDADE</span><strong>{businessConfig.city}</strong></article>
            ) : null}
            {businessConfig.hours ? (
              <article><Clock3 size={23} /><span>HORÁRIO</span><strong>{businessConfig.hours}</strong></article>
            ) : null}
            {contacts.length === 0 && !businessConfig.city && !businessConfig.hours ? (
              <p className="contactFallback">O formulário ao lado é o canal de contato disponível.</p>
            ) : null}
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

function SiteCta() {
  return (
    <section className="siteCta">
      <div className="siteContainer">
        <h2>Precisa conversar sobre uma entrega?</h2>
        <p>Envie as informações para a JS Boy analisar.</p>
        <div className="siteCtaActions">
          <Link to="/contato">Solicitar contato</Link>
          <Link to="/login">Já tenho acesso</Link>
        </div>
      </div>
    </section>
  );
}
