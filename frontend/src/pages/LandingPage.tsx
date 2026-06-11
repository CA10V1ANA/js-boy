import {
  Bike,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Repeat2,
  Route,
  Shield,
  UserRoundCheck,
  Zap,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  ['/', 'Inicio'],
  ['/servicos', 'Servicos'],
  ['/como-funciona', 'Como Funciona'],
  ['/para-empresas', 'Para Empresas'],
  ['/sobre', 'Sobre'],
  ['/contato', 'Contato'],
];

const benefits = [
  { icon: Zap, title: 'Agilidade', text: 'Coletas em ate 30 minutos na regiao central.' },
  { icon: Shield, title: 'Seguranca', text: 'Motoboys cadastrados e entregas acompanhadas no painel.' },
  { icon: Clock3, title: 'Pontualidade', text: '98% das entregas no prazo combinado.' },
  { icon: MapPin, title: 'Cobertura', text: 'Atendemos toda a grande Sao Paulo.' },
];

const services = [
  { icon: Building2, title: 'Entregas Empresariais', text: 'Logistica completa para industrias, escritorios e e-commerces.' },
  { icon: Zap, title: 'Entregas Urgentes', text: 'Coleta imediata e entrega no menor tempo possivel.' },
  { icon: CalendarDays, title: 'Entregas Programadas', text: 'Agende coletas com data e horario definidos.' },
  { icon: UserRoundCheck, title: 'Motoboy Fixo', text: 'Um motoboy dedicado exclusivamente a sua empresa.' },
  { icon: Route, title: 'Servicos Externos', text: 'Bancos, cartorios, despachantes e orgaos publicos.' },
  { icon: Repeat2, title: 'Rotas Recorrentes', text: 'Trajetos repetidos com previsibilidade e valor fixo.' },
];

const steps = [
  ['Solicitacao', 'Faca o pedido pelo site, WhatsApp ou painel.'],
  ['Analise', 'Confirmamos enderecos, tipo de servico e valor.'],
  ['Coleta', 'Motoboy retira o material no endereco informado.'],
  ['Entrega Confirmada', 'Confirmacao com foto e/ou assinatura do destinatario.'],
];

const segments = ['Industria', 'Comercio', 'E-commerce', 'Saude', 'Juridico', 'Imobiliario'];
const advantages = [
  'Faturamento mensal',
  'Painel exclusivo para sua equipe',
  'Atendimento dedicado',
  'Relatorios detalhados',
  'Multiplos usuarios',
  'Integracao via API sob demanda',
];

export function Brand() {
  return (
    <Link className="siteBrand" to="/" aria-label="JS Boy Inicio">
      <span className="siteBrandMark">
        <Bike size={23} strokeWidth={3} />
      </span>
      <span>
        <strong>JS BOY</strong>
        <small>ENTREGAS EMPRESARIAIS</small>
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
            <NavLink className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')} end={to === '/'} to={to} key={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="siteActions">
          <Link className="siteGhostButton" to="/contato">Orcamento</Link>
          <Link className="siteYellowButton small" to="/login">Entrar</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="siteContainer footerGrid">
        <div>
          <Brand />
          <p>Entregas empresariais ageis, seguras e organizadas.</p>
        </div>
        <div>
          <h3>Navegacao</h3>
          {navItems.map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>
        <div>
          <h3>Servicos</h3>
          <Link to="/servicos">Entregas Urgentes</Link>
          <Link to="/servicos">Entregas Programadas</Link>
          <Link to="/servicos">Motoboy Fixo</Link>
          <Link to="/servicos">Rotas Recorrentes</Link>
        </div>
        <div>
          <h3>Contato</h3>
          <span><Phone size={18} /> (11) 99999-9999</span>
          <span><MessageCircle size={18} /> WhatsApp</span>
          <span><Mail size={18} /> contato@jsboy.com.br</span>
        </div>
      </div>
      <div className="siteCopyright">© 2026 JS Boy Entregas Empresariais. <Bike size={13} /></div>
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
  return (
    <>
      <section className="siteHero">
        <div className="siteContainer siteHeroInner">
          <div className="siteHeroText">
            <span className="sitePill"><Bike size={14} /> ENTREGAS EMPRESARIAIS</span>
            <h1>Sua entrega <mark>no tempo certo</mark>, todo dia.</h1>
            <p>Motoboys profissionais para empresas que nao podem parar. Cadastre, organize e acompanhe suas entregas no painel.</p>
            <div className="siteHeroActions">
              <Link className="siteYellowButton" to="/contato">Calcular Entrega <span>→</span></Link>
              <a className="siteOutlineButton" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> WhatsApp
              </a>
            </div>
            <div className="siteStats">
              <div><strong>5k+</strong><span>ENTREGAS/MES</span></div>
              <div><strong>98%</strong><span>NO PRAZO</span></div>
              <div><strong>24/7</strong><span>ATENDIMENTO</span></div>
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
            <h2>Por que escolher a JS Boy?</h2>
            <p>Tudo o que sua empresa precisa em logistica de entregas.</p>
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
          <h2>Nossos Servicos</h2>
          <p>Solucoes de entrega pensadas para todo tipo de operacao empresarial.</p>
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
          <h2>Como Funciona</h2>
          <p>Processo simples, rapido e transparente.</p>
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
          <h2>Para Empresas</h2>
          <p>Logistica sob medida para o seu negocio.</p>
        </div>
        <div className="companiesGrid">
          <div>
            <h3>Segmentos Atendidos</h3>
            <div className="segmentList">
              {segments.map((segment) => <span key={segment}>{segment}</span>)}
            </div>
          </div>
          <div>
            <h3>Vantagens</h3>
            <ul className="advantageList">
              {advantages.map((advantage) => <li key={advantage}><Check size={18} /> {advantage}</li>)}
            </ul>
          </div>
        </div>
        <div className="companyCta">
          <h3>Quer ser cliente JS Boy?</h3>
          <p>Crie sua conta empresarial e gerencie tudo em um so lugar.</p>
          <Link to="/login" className="siteYellowButton">Criar conta empresarial</Link>
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
          <p>Entrega empresarial simples, direta e feita com responsabilidade.</p>
        </div>
        <div className="aboutCard">
          <h3>Logistica para quem precisa resolver.</h3>
          <p>
            A JS Boy nasceu para apoiar empresas que precisam de entregas rapidas, seguras e bem organizadas.
            O MVP do sistema ajuda a centralizar clientes, entregadores, entregas, valores, pagamentos e historico em um so painel.
          </p>
          <div className="aboutStats">
            <span><strong>24/7</strong> atendimento</span>
            <span><strong>98%</strong> no prazo</span>
            <span><strong>5k+</strong> entregas/mes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactPage() {
  return (
    <section className="siteSection contactSection publicStandalone">
      <div className="siteContainer contactGrid">
        <div>
          <div className="siteSectionTitle">
            <h2>Fale com a gente</h2>
            <p>Estamos prontos para atender sua empresa.</p>
          </div>
          <div className="contactList">
            <article><Phone size={23} /><span>TELEFONE</span><strong>(11) 99999-9999</strong></article>
            <article><MessageCircle size={23} /><span>WHATSAPP</span><strong>(11) 99999-9999</strong></article>
            <article><Mail size={23} /><span>E-MAIL</span><strong>contato@jsboy.com.br</strong></article>
            <article><MapPin size={23} /><span>ATENDIMENTO</span><strong>Toda Grande Sao Paulo</strong></article>
          </div>
          <div className="socialLinks">
            <a href="https://instagram.com" aria-label="Instagram"><Instagram size={21} /></a>
            <a href="https://facebook.com" aria-label="Facebook"><BriefcaseBusiness size={21} /></a>
          </div>
        </div>
        <form className="quoteForm">
          <h2>Solicitar Orcamento</h2>
          <label>Nome<input type="text" /></label>
          <label>Empresa<input type="text" /></label>
          <div className="formRow">
            <label>E-mail<input type="email" /></label>
            <label>Telefone<input type="tel" /></label>
          </div>
          <label>Mensagem<textarea rows={5} /></label>
          <button type="button">Enviar</button>
        </form>
      </div>
    </section>
  );
}

function SiteCta() {
  return (
    <section className="siteCta">
      <div className="siteContainer">
        <h2>Pronto para acelerar suas entregas?</h2>
        <p>Solicite atendimento, organize entregas no painel e fale com a gente direto no WhatsApp.</p>
        <div className="siteCtaActions">
          <Link to="/contato">Calcular agora</Link>
          <Link to="/login">Sou cliente</Link>
        </div>
        <div className="siteCtaChecks">
          <span><Check size={16} /> Sem mensalidade</span>
          <span><Check size={16} /> Pagamento facilitado</span>
          <span><Check size={16} /> Conta empresarial</span>
        </div>
      </div>
    </section>
  );
}
