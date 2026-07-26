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
  MessageCircle,
  PackageCheck,
  Phone,
  Route,
  UserRoundCheck,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ContactForm } from '../components/ContactForm';
import { businessConfig, BusinessContact } from '../config/business';

const navItems = [
  ['/', 'Inicio'],
  ['/servicos', 'Servicos'],
  ['/como-funciona', 'Como funciona'],
  ['/para-empresas', 'Para clientes'],
  ['/sobre', 'Sobre'],
  ['/contato', 'Contato'],
];

const benefits = [
  {
    icon: Route,
    title: 'Operacao organizada',
    text: 'Entregas, designacoes e status reunidos no sistema operacional da JS Boy.',
  },
  {
    icon: LockKeyhole,
    title: 'Acesso por perfil',
    text: 'Proprietario, entregadores e clientes acessam apenas as informacoes autorizadas.',
  },
  {
    icon: History,
    title: 'Historico',
    text: 'As mudancas de status ficam registradas para consulta no sistema.',
  },
  {
    icon: UserRoundCheck,
    title: 'Contato direto',
    text: 'A contratacao comeca por uma solicitacao de contato enviada para a JS Boy.',
  },
];

const services = [
  {
    icon: Bike,
    title: 'Coleta e entrega',
    text: 'Operacao de entregas conforme a necessidade analisada e confirmada pela JS Boy.',
  },
  {
    icon: Building2,
    title: 'Atendimento a clientes',
    text: 'Pessoas e empresas contratantes podem receber acesso protegido aos proprios dados.',
  },
  {
    icon: PackageCheck,
    title: 'Acompanhamento operacional',
    text: 'O sistema registra responsavel, andamento e historico das entregas cadastradas.',
  },
];

const steps = [
  ['Contato', 'Envie a necessidade pelo formulario disponivel neste site.'],
  ['Analise', 'A JS Boy avalia as informacoes e combina as condicoes diretamente com voce.'],
  ['Cadastro', 'Quando aprovado, o proprietario cria o cliente e o acesso protegido.'],
  ['Operacao', 'As entregas contratadas passam a ser acompanhadas no sistema.'],
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
    <Link className="siteBrand" to="/" aria-label="JS Boy Inicio">
      <span className="siteBrandMark">
        <Bike size={23} strokeWidth={3} />
      </span>
      <span>
        <strong>JS BOY</strong>
        <small>ENTREGAS</small>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="siteHeader">
      <div className="siteContainer siteHeaderInner">
        <Brand />
        <nav className="siteNav" aria-label="Navegacao do site">
          {navItems.map(([to, label]) => (
            <NavLink
              className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}
              end={to === '/'}
              to={to}
              key={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="siteActions">
          <Link className="siteGhostButton" to="/contato">Solicitar contato</Link>
          <Link className="siteYellowButton small" to="/login">Entrar</Link>
        </div>
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
          <p>Operacao de entregas da JS Boy.</p>
        </div>
        <div>
          <h3>Navegacao</h3>
          {navItems.map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>
        <div>
          <h3>Acesso</h3>
          <Link to="/login">Entrar no sistema</Link>
          <Link to="/contato">Solicitar contato</Link>
        </div>
        <div>
          <h3>Contato</h3>
          {contacts.length === 0 ? (
            <Link to="/contato">Formulario de contato</Link>
          ) : contacts.map((contact) => (
            <a key={contact.label} href={contact.href} target={contact.href?.startsWith('https://') ? '_blank' : undefined} rel="noreferrer">
              {contactIcon(contact)} {contact.value}
            </a>
          ))}
        </div>
      </div>
      <div className="siteCopyright">© {new Date().getFullYear()} JS Boy. <Bike size={13} /></div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <main className="sitePage">
      <PublicHeader />
      <Outlet />
      <SiteFooter />
    </main>
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
          <div className="siteHeroVisual" aria-hidden="true">
            <div className="siteBikeBadge">
              <Bike size={180} strokeWidth={2.8} />
            </div>
          </div>
        </div>
      </section>

      <section className="siteSection compact">
        <div className="siteContainer">
          <div className="siteSectionTitle centered">
            <h2>Uma operacao clara para cada perfil</h2>
            <p>O sistema apoia o trabalho diario sem expor dados de outros usuarios.</p>
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
          <h2>Servicos</h2>
          <p>O escopo de cada entrega e confirmado diretamente pela JS Boy.</p>
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
          <h2>Como funciona</h2>
          <p>O cadastro nao e publico: a JS Boy confirma cada novo acesso.</p>
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
          <h2>Para clientes</h2>
          <p>A JS Boy atende pessoas e empresas conforme avaliacao da necessidade.</p>
        </div>
        <div className="companiesGrid">
          <div>
            <h3>Antes de comecar</h3>
            <p>
              Envie a solicitacao de contato. O proprietario confirma a contratacao e cria o cadastro quando aplicavel.
            </p>
          </div>
          <div>
            <h3>Acesso protegido</h3>
            <ul className="advantageList">
              <li><Check size={18} /> Cadastro criado pela JS Boy</li>
              <li><Check size={18} /> Consulta apenas das proprias entregas</li>
              <li><Check size={18} /> Consulta dos proprios pagamentos</li>
            </ul>
          </div>
        </div>
        <div className="companyCta">
          <h3>Quer conversar com a JS Boy?</h3>
          <p>Use o formulario para informar sua necessidade.</p>
          <Link to="/contato" className="siteYellowButton">Solicitar contato</Link>
        </div>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <section className="siteSection publicStandalone">
      <div className="siteContainer aboutGrid">
        <div className="siteSectionTitle">
          <h2>Sobre a JS Boy</h2>
          <p>Uma unica empresa operadora, com acesso separado para cada usuario.</p>
        </div>
        <div className="aboutCard">
          <h3>Operacao direta</h3>
          <p>
            A JS Boy administra suas entregas, seus entregadores e os clientes contratantes.
            O sistema foi criado para organizar essa operacao e proteger as informacoes de cada perfil.
          </p>
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
            <h2>Fale com a JS Boy</h2>
            <p>Envie uma solicitacao para a equipe avaliar sua necessidade.</p>
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
              <article><Clock3 size={23} /><span>HORARIO</span><strong>{businessConfig.hours}</strong></article>
            ) : null}
            {contacts.length === 0 && !businessConfig.city && !businessConfig.hours ? (
              <p className="contactFallback">O formulario ao lado e o canal de contato disponivel.</p>
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
        <p>Envie as informacoes para a JS Boy analisar.</p>
        <div className="siteCtaActions">
          <Link to="/contato">Solicitar contato</Link>
          <Link to="/login">Ja tenho acesso</Link>
        </div>
      </div>
    </section>
  );
}
