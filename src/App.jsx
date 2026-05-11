import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase, supabaseEnabled } from "./services/supabase";

const menuItems = [
  { id: "inicio", label: "Início", icon: "🏠" },
  { id: "anotacoes", label: "Anotações", icon: "📝" },
  { id: "frases", label: "Frases prontas", icon: "⚡" },
  { id: "links", label: "Links importantes", icon: "🔗" },
  { id: "escala", label: "Escala", icon: "📊" },
  { id: "calendario", label: "Calendário", icon: "📅" },
  { id: "eventos", label: "Eventos", icon: "📌" },
  { id: "timer", label: "Timer", icon: "⏱️" },
  { id: "config", label: "Configurações", icon: "⚙️" },
];

function hojeInput() {
  return new Date().toISOString().slice(0, 16);
}

function criarId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function formatarData(data) {
  if (!data) return "Sem data";
  return new Date(data).toLocaleString("pt-BR");
}

function getLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function extrairSrcIframe(valor) {
  if (!valor) return "";
  const match = valor.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : valor.trim();
}

function nomeUsuario(usuario) {
  if (!usuario) return "Usuário";
  return (
    usuario.nome ||
    usuario.user_metadata?.nome ||
    usuario.user_metadata?.name ||
    usuario.email?.split("@")[0] ||
    "Usuário"
  );
}

function normalizarComando(valor) {
  const limpo = String(valor || "").trim().toLowerCase();
  if (!limpo) return "";
  return limpo.startsWith("/") ? limpo : "/" + limpo;
}

function useTabela(nomeTabela, usuario) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    if (!usuario) return;
    setCarregando(true);

    if (supabaseEnabled && usuario.id) {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select("*")
        .order("criado_em", { ascending: false });

      if (!error) setDados(data || []);
      if (error) console.error(error);
    } else {
      setDados(getLocal(nomeTabela, []));
    }

    setCarregando(false);
  }

  async function adicionar(item) {
    if (supabaseEnabled && usuario?.id) {
      const { error } = await supabase.from(nomeTabela).insert({
        ...item,
        user_id: usuario.id,
      });

      if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
      }
      await carregar();
    } else {
      const novo = {
        ...item,
        id: criarId(),
        criado_em: new Date().toISOString(),
      };
      const lista = [novo, ...dados];
      setDados(lista);
      setLocal(nomeTabela, lista);
    }
  }

  async function atualizar(id, alteracoes) {
    if (supabaseEnabled && usuario?.id) {
      const { error } = await supabase.from(nomeTabela).update(alteracoes).eq("id", id);
      if (error) {
        alert("Erro ao atualizar: " + error.message);
        return;
      }
      await carregar();
    } else {
      const lista = dados.map((item) => (item.id === id ? { ...item, ...alteracoes } : item));
      setDados(lista);
      setLocal(nomeTabela, lista);
    }
  }

  async function remover(id) {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    if (supabaseEnabled && usuario?.id) {
      const { error } = await supabase.from(nomeTabela).delete().eq("id", id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
      }
      await carregar();
    } else {
      const lista = dados.filter((item) => item.id !== id);
      setDados(lista);
      setLocal(nomeTabela, lista);
    }
  }

  useEffect(() => {
    carregar();
  }, [nomeTabela, usuario?.id, usuario?.email]);

  return { dados, carregando, adicionar, atualizar, remover, recarregar: carregar };
}

function Login({ onLogin }) {
  const [nome, setNome] = useState("Jerlylan");
  const [email, setEmail] = useState("admin@teste.com");
  const [senha, setSenha] = useState("123456");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [erro, setErro] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setErro("");

    if (supabaseEnabled) {
      const resposta = modoCadastro
        ? await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome } },
          })
        : await supabase.auth.signInWithPassword({ email, password: senha });

      if (resposta.error) {
        setErro(resposta.error.message);
        return;
      }

      if (modoCadastro) {
        setErro("Cadastro criado. Se o Supabase pedir confirmação, confirme pelo email.");
        setModoCadastro(false);
      }
      return;
    }

    if (email === "admin@teste.com" && senha === "123456") {
      const usuarioDemo = { email, nome: nome || "Usuário Demo" };
      setLocal("usuario_demo", usuarioDemo);
      onLogin(usuarioDemo);
    } else {
      setErro("No modo demonstração use admin@teste.com e senha 123456.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-area">
          <div className="logo">PT</div>
          <div>
            <h1>Painel de Trabalho</h1>
            <p>Organize escala, frases, links, eventos e anotações.</p>
          </div>
        </div>

        <form onSubmit={entrar} className="form">
          <label>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" />

          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" />

          {erro && <div className="alerta">{erro}</div>}

          <button className="btn primary" type="submit">
            {modoCadastro ? "Criar conta" : "Entrar"}
          </button>

          {supabaseEnabled ? (
            <button className="btn ghost" type="button" onClick={() => setModoCadastro(!modoCadastro)}>
              {modoCadastro ? "Já tenho conta" : "Criar nova conta"}
            </button>
          ) : (
            <p className="hint">
              Modo demonstração ativo. Configure o Supabase para login real e dados online.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Layout({ usuario, onLogout, pagina, setPagina, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo small">PT</div>
          <div>
            <strong>Painel</strong>
            <span>Trabalho</span>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={pagina === item.id ? "active" : ""}
              onClick={() => setPagina(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-box">
          <p>Logado como:</p>
          <strong>{nomeUsuario(usuario)}</strong>
          <small>{usuario?.email}</small>
          <button className="btn sair" onClick={onLogout}>Sair</button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

function Header({ titulo, subtitulo, usuario }) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </div>

      {usuario && (
        <div className="top-user">
          <span>Usuário logado</span>
          <strong>{nomeUsuario(usuario)}</strong>
        </div>
      )}
    </header>
  );
}

function Card({ titulo, valor, descricao }) {
  return (
    <div className="card">
      <p>{titulo}</p>
      <h2>{valor}</h2>
      <span>{descricao}</span>
    </div>
  );
}

function Inicio({ usuario, anotacoes, frases, links, eventos, registros }) {
  const hoje = new Date();

  const eventosHoje = eventos.filter((e) => {
    if (!e.data_inicio) return false;
    const d = new Date(e.data_inicio);
    return d.toDateString() === hoje.toDateString();
  });

  const prazosPendentes = registros.filter((r) => r.status !== "concluido");
  const prazosVencidos = prazosPendentes.filter((r) => r.prazo && new Date(r.prazo) < hoje);

  return (
    <>
      <Header
        titulo={`Bom dia, ${nomeUsuario(usuario)}!`}
        subtitulo="Resumo rápido da sua rotina de trabalho."
        usuario={usuario}
      />

      <section className="cards-grid">
        <Card titulo="Eventos cadastrados" valor={eventos.length} descricao={`${eventosHoje.length} evento(s) hoje`} />
        <Card titulo="Prazos pendentes" valor={prazosPendentes.length} descricao={`${prazosVencidos.length} vencido(s)`} />
        <Card titulo="Frases prontas" valor={frases.length} descricao="atalhos salvos" />
        <Card titulo="Links importantes" valor={links.length} descricao="links cadastrados" />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>Próximos prazos</h2>
          {prazosPendentes.slice(0, 5).map((r) => (
            <div className="linha" key={r.id}>
              <strong>{r.titulo}</strong>
              <span>{r.setor || "Sem setor"} • {formatarData(r.prazo)} • {r.status}</span>
            </div>
          ))}
          {!prazosPendentes.length && <p className="empty">Nenhum prazo pendente.</p>}
        </div>

        <div className="panel">
          <h2>Próximos eventos</h2>
          {eventos.slice(0, 5).map((e) => (
            <div className="linha" key={e.id}>
              <strong>{e.titulo}</strong>
              <span>{formatarData(e.data_inicio)}</span>
            </div>
          ))}
          {!eventos.length && <p className="empty">Nenhum evento cadastrado.</p>}
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>Últimas anotações</h2>
          {anotacoes.slice(0, 4).map((a) => (
            <div className="linha" key={a.id}>
              <strong>{a.titulo}</strong>
              <span>{a.categoria || "Sem categoria"} • {formatarData(a.criado_em)}</span>
            </div>
          ))}
          {!anotacoes.length && <p className="empty">Nenhuma anotação ainda.</p>}
        </div>

        <div className="panel">
          <h2>Atalhos rápidos</h2>
          {frases.slice(0, 4).map((f) => (
            <div className="linha" key={f.id}>
              <strong>{f.comando || "Sem comando"}</strong>
              <span>{f.titulo}</span>
            </div>
          ))}
          {!frases.length && <p className="empty">Nenhuma frase pronta ainda.</p>}
        </div>
      </section>
    </>
  );
}

function Anotacoes({ store }) {
  const [form, setForm] = useState({ titulo: "", conteudo: "", categoria: "" });
  const [editandoId, setEditandoId] = useState(null);

  function limpar() {
    setForm({ titulo: "", conteudo: "", categoria: "" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return alert("Digite um título.");

    if (editandoId) {
      store.atualizar(editandoId, form);
    } else {
      store.adicionar(form);
    }

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo || "",
      conteudo: item.conteudo || "",
      categoria: item.categoria || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header titulo="Anotações" subtitulo="Guarde comentários e informações importantes." />

      <form className="panel form-grid" onSubmit={salvar}>
        <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <input placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
        <textarea placeholder="Digite sua anotação..." value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
        <div className="botoes esquerda">
          <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar anotação"}</button>
          {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>{item.titulo}</h3>
              <p>{item.conteudo}</p>
              <small>{item.categoria || "Sem categoria"} • {formatarData(item.criado_em)}</small>
            </div>
            <div className="botoes">
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FrasesProntas({ store }) {
  const [form, setForm] = useState({ titulo: "", comando: "", mensagem: "" });
  const [comandoBusca, setComandoBusca] = useState("");
  const [resultado, setResultado] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  function limpar() {
    setForm({ titulo: "", comando: "", mensagem: "" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensagem.trim()) {
      return alert("Preencha título e mensagem.");
    }

    const item = {
      ...form,
      comando: normalizarComando(form.comando),
    };

    if (!item.comando) {
      return alert("Digite um comando, exemplo: /teste");
    }

    const jaExiste = store.dados.some(
      (f) => normalizarComando(f.comando) === item.comando && f.id !== editandoId
    );

    if (jaExiste) {
      return alert("Esse comando já existe. Escolha outro.");
    }

    if (editandoId) {
      store.atualizar(editandoId, item);
    } else {
      store.adicionar(item);
    }

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo || "",
      comando: item.comando || "",
      mensagem: item.mensagem || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copiar(texto) {
    await navigator.clipboard.writeText(texto);
    alert("Mensagem copiada!");
  }

  function buscarComando(valor) {
    setComandoBusca(valor);
    const comando = normalizarComando(valor);
    if (!comando) {
      setResultado(null);
      return;
    }

    const encontrado = store.dados.find((f) => normalizarComando(f.comando) === comando);
    setResultado(encontrado || null);
  }

  return (
    <>
      <Header
        titulo="Frases prontas"
        subtitulo="Crie atalhos como /teste para buscar uma mensagem rapidamente."
      />

      <section className="grid-2">
        <form className="panel form-grid" onSubmit={salvar}>
          <h2>{editandoId ? "Editar frase" : "Nova frase pronta"}</h2>
          <input
            placeholder="Título, exemplo: Saudação"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <input
            placeholder="Comando, exemplo: /teste"
            value={form.comando}
            onChange={(e) => setForm({ ...form, comando: e.target.value })}
          />
          <textarea
            placeholder="Texto da mensagem..."
            value={form.mensagem}
            onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          />
          <div className="botoes esquerda">
            <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar frase"}</button>
            {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
          </div>
        </form>

        <div className="panel form-grid">
          <h2>Usar comando</h2>
          <p className="hint">Digite um atalho salvo, exemplo: /teste</p>
          <input
            placeholder="/teste"
            value={comandoBusca}
            onChange={(e) => buscarComando(e.target.value)}
          />

          {resultado ? (
            <div className="resultado-comando">
              <strong>{resultado.titulo}</strong>
              <p>{resultado.mensagem}</p>
              <button className="btn primary" onClick={() => copiar(resultado.mensagem)}>
                Copiar mensagem
              </button>
            </div>
          ) : (
            <div className="empty box">Nenhuma frase encontrada para esse comando.</div>
          )}
        </div>
      </section>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>{item.titulo}</h3>
              <p>{item.mensagem}</p>
              <small>Comando: <strong>{item.comando}</strong></small>
            </div>
            <div className="botoes">
              <button className="btn" onClick={() => copiar(item.mensagem)}>Copiar</button>
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function LinksImportantes({ store }) {
  const [form, setForm] = useState({ titulo: "", url: "", categoria: "", descricao: "" });
  const [editandoId, setEditandoId] = useState(null);

  function limpar() {
    setForm({ titulo: "", url: "", categoria: "", descricao: "" });
    setEditandoId(null);
  }

  function normalizarUrl(url) {
    const limpa = url.trim();
    if (!limpa) return "";
    if (limpa.startsWith("http://") || limpa.startsWith("https://")) return limpa;
    return "https://" + limpa;
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) {
      return alert("Preencha título e URL.");
    }

    const item = {
      ...form,
      url: normalizarUrl(form.url),
    };

    if (editandoId) {
      store.atualizar(editandoId, item);
    } else {
      store.adicionar(item);
    }

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo || "",
      url: item.url || "",
      categoria: item.categoria || "",
      descricao: item.descricao || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header titulo="Links importantes" subtitulo="Salve atalhos para sistemas, sites e documentos importantes." />

      <form className="panel form-grid" onSubmit={salvar}>
        <input placeholder="Título do link" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <input placeholder="URL, exemplo: https://site.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <input placeholder="Categoria, exemplo: Trabalho" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
        <textarea placeholder="Descrição opcional" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <div className="botoes esquerda">
          <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar link"}</button>
          {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <div className="links-grid">
        {store.dados.map((item) => (
          <div className="panel link-card" key={item.id}>
            <div>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
              <small>{item.categoria || "Sem categoria"}</small>
            </div>
            <a className="btn primary" href={item.url} target="_blank" rel="noreferrer">
              Abrir link
            </a>
            <div className="botoes esquerda">
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
        {!store.dados.length && <div className="panel empty big">Nenhum link salvo ainda.</div>}
      </div>
    </>
  );
}

function Escala({ config }) {
  return (
    <>
      <Header titulo="Escala de trabalho" subtitulo="Sua escala do Google Sheets incorporada no painel." />

      <div className="panel">
        {config.sheetUrl ? (
          <iframe
            title="Escala de trabalho"
            src={config.sheetUrl}
            className="sheet-frame"
          />
        ) : (
          <div className="empty big">
            Cole o link iframe da sua planilha na aba Configurações.
          </div>
        )}
      </div>
    </>
  );
}

function Calendario({ store }) {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data_inicio: hojeInput(),
    data_fim: "",
    lembrete_minutos: 30,
    status: "pendente",
  });
  const [editandoId, setEditandoId] = useState(null);

  function limpar() {
    setForm({ titulo: "", descricao: "", data_inicio: hojeInput(), data_fim: "", lembrete_minutos: 30, status: "pendente" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return alert("Digite o título do evento.");

    if (editandoId) {
      store.atualizar(editandoId, form);
    } else {
      store.adicionar(form);
    }

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      data_inicio: item.data_inicio ? String(item.data_inicio).slice(0, 16) : hojeInput(),
      data_fim: item.data_fim ? String(item.data_fim).slice(0, 16) : "",
      lembrete_minutos: item.lembrete_minutos || 30,
      status: item.status || "pendente",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const eventosCalendario = store.dados.map((e) => ({
    id: e.id,
    title: e.titulo,
    start: e.data_inicio,
    end: e.data_fim || undefined,
  }));

  return (
    <>
      <Header titulo="Calendário" subtitulo="Marque eventos importantes e lembretes." />

      <section className="grid-2">
        <form className="panel form-grid" onSubmit={salvar}>
          <h2>{editandoId ? "Editar evento" : "Novo evento"}</h2>
          <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <label>Data e hora</label>
          <input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
          <label>Lembrete em minutos</label>
          <input type="number" value={form.lembrete_minutos} onChange={(e) => setForm({ ...form, lembrete_minutos: Number(e.target.value) })} />
          <div className="botoes esquerda">
            <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar evento"}</button>
            {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
          </div>
        </form>

        <div className="panel calendar-panel">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            events={eventosCalendario}
            height="auto"
          />
        </div>
      </section>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
              <small>{formatarData(item.data_inicio)} • lembrete {item.lembrete_minutos} min antes</small>
            </div>
            <div className="botoes">
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Eventos({ store }) {
  const [form, setForm] = useState({
    setor: "",
    titulo: "",
    descricao: "",
    prazo: hojeInput(),
    status: "em andamento",
  });
  const [editandoId, setEditandoId] = useState(null);

  function limpar() {
    setForm({ setor: "", titulo: "", descricao: "", prazo: hojeInput(), status: "em andamento" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return alert("Digite o título.");

    if (editandoId) {
      store.atualizar(editandoId, form);
    } else {
      store.adicionar(form);
    }

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({
      setor: item.setor || "",
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      prazo: item.prazo ? String(item.prazo).slice(0, 16) : hojeInput(),
      status: item.status || "em andamento",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header titulo="Registro de eventos" subtitulo="Controle demandas, prazos e ocorrências." />

      <form className="panel form-grid" onSubmit={salvar}>
        <input placeholder="Setor" value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} />
        <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        <textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <label>Prazo</label>
        <input type="datetime-local" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="em andamento">Em andamento</option>
          <option value="pendente">Pendente</option>
          <option value="concluido">Concluído</option>
        </select>
        <div className="botoes esquerda">
          <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar registro"}</button>
          {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
              <small>{item.setor || "Sem setor"} • Prazo: {formatarData(item.prazo)} • {item.status}</small>
            </div>
            <div className="botoes">
              {item.status !== "concluido" && (
                <button className="btn" onClick={() => store.atualizar(item.id, { status: "concluido" })}>
                  Concluir
                </button>
              )}
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Timer({ registros }) {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function calcular(prazo) {
    if (!prazo) return { texto: "Sem prazo", classe: "" };

    const diff = new Date(prazo) - agora;
    const vencido = diff < 0;
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 1000 / 60 / 60);
    const m = Math.floor((abs / 1000 / 60) % 60);
    const s = Math.floor((abs / 1000) % 60);

    return {
      texto: `${vencido ? "Vencido há" : "Falta"} ${h}h ${m}min ${s}s`,
      classe: vencido ? "vencido" : diff < 30 * 60 * 1000 ? "alerta-prazo" : "ok-prazo",
    };
  }

  const pendentes = registros.filter((r) => r.status !== "concluido");

  return (
    <>
      <Header titulo="Timer de prazos" subtitulo="Acompanhe os prazos dos registros em aberto." />

      <div className="lista">
        {pendentes.map((item) => {
          const tempo = calcular(item.prazo);
          return (
            <div className="panel item timer-item" key={item.id}>
              <div>
                <h3>{item.titulo}</h3>
                <p>{item.setor || "Sem setor"} • Prazo: {formatarData(item.prazo)}</p>
              </div>
              <strong className={tempo.classe}>{tempo.texto}</strong>
            </div>
          );
        })}
        {!pendentes.length && <div className="panel empty big">Nenhum prazo pendente.</div>}
      </div>
    </>
  );
}

function Configuracoes({ config, setConfig }) {
  const [valor, setValor] = useState(config.sheetUrl || "");

  function salvar(e) {
    e.preventDefault();
    const sheetUrl = extrairSrcIframe(valor);
    const novo = { ...config, sheetUrl };
    setConfig(novo);
    setLocal("configuracoes", novo);
    alert("Configurações salvas!");
  }

  return (
    <>
      <Header titulo="Configurações" subtitulo="Ajustes simples do painel." />

      <form className="panel form-grid" onSubmit={salvar}>
        <h2>Google Sheets</h2>
        <p className="hint">
          Cole aqui o link da planilha publicada ou o código iframe completo.
        </p>
        <textarea
          placeholder='<iframe src="https://docs.google.com/spreadsheets/..."></iframe>'
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button className="btn primary">Salvar escala</button>
      </form>

      <div className="panel">
        <h2>Como publicar a escala</h2>
        <ol className="passos">
          <li>Abra sua planilha no Google Sheets.</li>
          <li>Clique em Arquivo.</li>
          <li>Clique em Compartilhar.</li>
          <li>Clique em Publicar na Web.</li>
          <li>Escolha a opção Incorporar.</li>
          <li>Copie o iframe ou o link e cole aqui.</li>
        </ol>
      </div>
    </>
  );
}

export default function App() {
  const [pagina, setPagina] = useState("inicio");
  const [usuario, setUsuario] = useState(null);
  const [config, setConfig] = useState(() => getLocal("configuracoes", { sheetUrl: "" }));

  useEffect(() => {
    async function iniciar() {
      if (supabaseEnabled) {
        const { data } = await supabase.auth.getSession();
        setUsuario(data.session?.user || null);

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUsuario(session?.user || null);
        });

        return () => listener.subscription.unsubscribe();
      } else {
        setUsuario(getLocal("usuario_demo", null));
      }
    }

    iniciar();
  }, []);

  const anotacoes = useTabela("anotacoes", usuario);
  const frases = useTabela("mensagens_rapidas", usuario);
  const links = useTabela("links_importantes", usuario);
  const eventos = useTabela("eventos", usuario);
  const registros = useTabela("registros", usuario);

  async function sair() {
    if (supabaseEnabled) await supabase.auth.signOut();
    localStorage.removeItem("usuario_demo");
    setUsuario(null);
  }

  const conteudo = useMemo(() => {
    if (pagina === "inicio") {
      return (
        <Inicio
          usuario={usuario}
          anotacoes={anotacoes.dados}
          frases={frases.dados}
          links={links.dados}
          eventos={eventos.dados}
          registros={registros.dados}
        />
      );
    }
    if (pagina === "anotacoes") return <Anotacoes store={anotacoes} />;
    if (pagina === "frases") return <FrasesProntas store={frases} />;
    if (pagina === "links") return <LinksImportantes store={links} />;
    if (pagina === "escala") return <Escala config={config} />;
    if (pagina === "calendario") return <Calendario store={eventos} />;
    if (pagina === "eventos") return <Eventos store={registros} />;
    if (pagina === "timer") return <Timer registros={registros.dados} />;
    if (pagina === "config") return <Configuracoes config={config} setConfig={setConfig} />;
    return null;
  }, [pagina, usuario, anotacoes.dados, frases.dados, links.dados, eventos.dados, registros.dados, config]);

  if (!usuario) return <Login onLogin={setUsuario} />;

  return (
    <Layout usuario={usuario} onLogout={sair} pagina={pagina} setPagina={setPagina}>
      {conteudo}
    </Layout>
  );
}
