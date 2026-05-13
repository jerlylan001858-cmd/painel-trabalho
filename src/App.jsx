import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase, supabaseEnabled } from "./services/supabase";

const menuItems = [
  { id: "inicio", label: "Início", icon: "🏠" },
  { id: "anotacoes", label: "Anotações", icon: "📝" },
  { id: "frases", label: "Frases prontas", icon: "⚡" },
  { id: "osnoc", label: "OS NOC", icon: "🧾" },
  { id: "osabertas", label: "OS abertas", icon: "📋" },
  { id: "links", label: "Links importantes", icon: "🔗" },
  { id: "escala", label: "Escala", icon: "📊" },
  { id: "calendario", label: "Calendário", icon: "📅" },
  { id: "eventos", label: "Eventos", icon: "📌" },
  { id: "timer", label: "Timer", icon: "⏱️" },
  { id: "perfil", label: "Perfil", icon: "😺" },
  { id: "config", label: "Configurações", icon: "⚙️" },
];

const avatarOptions = [
  { id: "avatar1", nome: "Gatinho curioso", src: "/avatars/avatar1.jpeg" },
  { id: "avatar2", nome: "Gato headset", src: "/avatars/avatar2.jpeg" },
  { id: "avatar3", nome: "Gato executivo", src: "/avatars/avatar3.jpeg" },
  { id: "avatar4", nome: "Cachorro elegante", src: "/avatars/avatar4.jpeg" },
  { id: "avatar5", nome: "Gato de óculos", src: "/avatars/avatar5.jpeg" },
  { id: "avatar6", nome: "Gatinho escritório", src: "/avatars/avatar6.jpeg" },
];

function avatarUsuario(usuario) {
  return usuario?.user_metadata?.avatar || usuario?.avatar || avatarOptions[0].src;
}


function pad(numero) {
  return String(numero).padStart(2, "0");
}

function dataLocalParaInput(data = new Date()) {
  const d = data instanceof Date ? data : new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function hojeInput() {
  return dataLocalParaInput(new Date());
}

function inputParaISO(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data.toISOString();
}

function criarId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function formatarData(data) {
  if (!data) return "Sem data";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarTempoRestante(prazo, agora = new Date()) {
  if (!prazo) return { texto: "Sem prazo", classe: "" };

  const dataPrazo = new Date(prazo);
  if (Number.isNaN(dataPrazo.getTime())) {
    return { texto: "Prazo inválido", classe: "vencido" };
  }

  const diff = dataPrazo.getTime() - agora.getTime();
  const vencido = diff < 0;
  const abs = Math.abs(diff);

  const dias = Math.floor(abs / 1000 / 60 / 60 / 24);
  const horas = Math.floor((abs / 1000 / 60 / 60) % 24);
  const minutos = Math.floor((abs / 1000 / 60) % 60);
  const segundos = Math.floor((abs / 1000) % 60);

  const partes = [];
  if (dias > 0) partes.push(`${dias}d`);
  partes.push(`${horas}h`);
  partes.push(`${minutos}min`);
  partes.push(`${segundos}s`);

  return {
    texto: `${vencido ? "Vencido há" : "Falta"} ${partes.join(" ")}`,
    classe: vencido ? "vencido" : diff < 30 * 60 * 1000 ? "alerta-prazo" : "ok-prazo",
  };
}

function saudacaoPorHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
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

function gerarTextoFechamentoOS({ matricula, nome_completo, feito }) {
  const linhas = [
    "OS finalizada pelo NOC.",
    "",
    `Matrícula: ${matricula || "Não informada"}`,
    `Nome completo: ${nome_completo || "Não informado"}`,
    "",
    "Procedimento realizado:",
    feito || "Não informado",
    "",
    "Ordem de serviço concluída conforme procedimento realizado.",
  ];

  return linhas.join("\n");
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

function useConfigCompartilhada(usuario) {
  const [config, setConfig] = useState(() =>
    getLocal("configuracoes", { sheetUrl: "" })
  );

  async function carregar() {
    if (!usuario) return;

    if (supabaseEnabled && usuario.id) {
      const { data, error } = await supabase
        .from("app_config")
        .select("*")
        .eq("chave", "sheet_url")
        .maybeSingle();

      if (!error && data?.valor) {
        const novo = { sheetUrl: data.valor };
        setConfig(novo);
        setLocal("configuracoes", novo);
      }

      if (error) console.error(error);
    }
  }

  async function salvarSheetUrl(sheetUrl) {
    const novo = { sheetUrl };

    setConfig(novo);
    setLocal("configuracoes", novo);

    if (supabaseEnabled && usuario?.id) {
      const { error } = await supabase.from("app_config").upsert(
        {
          chave: "sheet_url",
          valor: sheetUrl,
          atualizado_por: usuario.id,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "chave" }
      );

      if (error) {
        alert("Erro ao salvar escala compartilhada: " + error.message);
        return false;
      }
    }

    return true;
  }

  useEffect(() => {
    carregar();
  }, [usuario?.id, usuario?.email]);

  return {
    config,
    setConfig,
    salvarSheetUrl,
    recarregarConfig: carregar,
  };
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
            options: { data: { nome, avatar: avatarOptions[0].src } },
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
          <img className="avatar-mini" src={avatarUsuario(usuario)} alt="Avatar do usuário" />
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
          <img className="avatar-top" src={avatarUsuario(usuario)} alt="Avatar do usuário" />
          <div>
            <span>Usuário logado</span>
            <strong>{nomeUsuario(usuario)}</strong>
          </div>
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

function Inicio({ usuario, anotacoes, frases, links, eventos, registros, osnoc, osabertas }) {
  const hoje = new Date();

  const eventosHoje = eventos.filter((e) => {
    if (!e.data_inicio) return false;
    const d = new Date(e.data_inicio);
    return d.toDateString() === hoje.toDateString();
  });

  const prazosPendentes = registros.filter((r) => r.status !== "concluido");
  const prazosVencidos = prazosPendentes.filter((r) => r.prazo && new Date(r.prazo) < hoje);
  const osAbertas = osabertas.filter((o) => o.status !== "concluida");

  return (
    <>
      <Header
        titulo={`${saudacaoPorHora()}, ${nomeUsuario(usuario)}!`}
        subtitulo="Resumo compartilhado da rotina de trabalho."
        usuario={usuario}
      />

      <section className="cards-grid">
        <Card titulo="Eventos cadastrados" valor={eventos.length} descricao={`${eventosHoje.length} evento(s) hoje`} />
        <Card titulo="Prazos pendentes" valor={prazosPendentes.length} descricao={`${prazosVencidos.length} vencido(s)`} />
        <Card titulo="OS abertas" valor={osAbertas.length} descricao={`${osabertas.length} protocolo(s) registrado(s)`} />
        <Card titulo="Frases prontas" valor={frases.length} descricao="atalhos salvos" />
        <Card titulo="Links importantes" valor={links.length} descricao="links cadastrados" />
        <Card titulo="OS NOC" valor={osnoc.length} descricao="fechamentos salvos" />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>Ordens de serviço abertas</h2>
          {osAbertas.slice(0, 5).map((o) => (
            <div className="linha" key={o.id}>
              <strong>Protocolo: {o.protocolo}</strong>
              <span>{o.descricao || "Sem descrição"} • {o.status}</span>
            </div>
          ))}
          {!osAbertas.length && <p className="empty">Nenhuma OS aberta.</p>}
        </div>

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
      <Header titulo="Anotações compartilhadas" subtitulo="Tudo que for salvo aqui aparece para todos os usuários logados." />

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


function OSNOC({ store }) {
  const [form, setForm] = useState({
    matricula: "",
    nome_completo: "",
    feito: "",
    texto_fechamento: "",
  });
  const [editandoId, setEditandoId] = useState(null);

  const textoGerado = gerarTextoFechamentoOS(form);

  function limpar() {
    setForm({ matricula: "", nome_completo: "", feito: "", texto_fechamento: "" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();

    if (!form.matricula.trim() || !form.nome_completo.trim() || !form.feito.trim()) {
      return alert("Preencha matrícula, nome completo e o que foi feito.");
    }

    const item = {
      matricula: form.matricula.trim(),
      nome_completo: form.nome_completo.trim(),
      feito: form.feito.trim(),
      texto_fechamento: form.texto_fechamento?.trim() || textoGerado,
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
      matricula: item.matricula || "",
      nome_completo: item.nome_completo || "",
      feito: item.feito || "",
      texto_fechamento: item.texto_fechamento || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copiar(texto) {
    await navigator.clipboard.writeText(texto);
    alert("Texto copiado!");
  }

  return (
    <>
      <Header
        titulo="OS NOC"
        subtitulo="Monte, salve e copie textos de fechamento de ordem de serviço."
      />

      <section className="grid-2">
        <form className="panel form-grid" onSubmit={salvar}>
          <h2>{editandoId ? "Editar fechamento" : "Novo fechamento"}</h2>

          <label>Matrícula</label>
          <input
            placeholder="Exemplo: 12345"
            value={form.matricula}
            onChange={(e) => setForm({ ...form, matricula: e.target.value })}
          />

          <label>Nome completo</label>
          <input
            placeholder="Nome completo do responsável"
            value={form.nome_completo}
            onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
          />

          <label>O que foi feito na ordem de serviço</label>
          <textarea
            placeholder="Descreva o procedimento realizado..."
            value={form.feito}
            onChange={(e) => setForm({ ...form, feito: e.target.value })}
          />

          <label>Texto de fechamento personalizado, opcional</label>
          <textarea
            placeholder="Se deixar vazio, o sistema gera automaticamente."
            value={form.texto_fechamento}
            onChange={(e) => setForm({ ...form, texto_fechamento: e.target.value })}
          />

          <div className="botoes esquerda">
            <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar OS NOC"}</button>
            {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
          </div>
        </form>

        <div className="panel form-grid">
          <h2>Prévia do texto</h2>
          <pre className="preview-texto">{form.texto_fechamento || textoGerado}</pre>
          <button
            className="btn primary"
            type="button"
            onClick={() => copiar(form.texto_fechamento || textoGerado)}
          >
            Copiar texto
          </button>
        </div>
      </section>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>{item.nome_completo}</h3>
              <p><strong>Matrícula:</strong> {item.matricula}</p>
              <p>{item.feito}</p>
              <small>{formatarData(item.criado_em)}</small>
            </div>

            <div className="botoes">
              <button className="btn" onClick={() => copiar(item.texto_fechamento || gerarTextoFechamentoOS(item))}>
                Copiar
              </button>
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}

        {!store.dados.length && <div className="panel empty big">Nenhuma OS NOC salva ainda.</div>}
      </div>
    </>
  );
}

function OSAbertas({ store }) {
  const [form, setForm] = useState({ protocolo: "", descricao: "", status: "aberta" });
  const [editandoId, setEditandoId] = useState(null);
  const abertas = store.dados.filter((o) => o.status !== "concluida");

  function limpar() {
    setForm({ protocolo: "", descricao: "", status: "aberta" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.protocolo.trim()) return alert("Digite o protocolo da ordem de serviço.");

    const item = {
      protocolo: form.protocolo.trim(),
      descricao: form.descricao.trim(),
      status: form.status,
    };

    if (editandoId) store.atualizar(editandoId, item);
    else store.adicionar(item);

    limpar();
  }

  function editar(item) {
    setEditandoId(item.id);
    setForm({ protocolo: item.protocolo || "", descricao: item.descricao || "", status: item.status || "aberta" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header titulo="OS abertas" subtitulo="Registre a quantidade de ordens de serviço abertas e seus protocolos." />

      <section className="cards-grid">
        <Card titulo="OS abertas" valor={abertas.length} descricao="status aberta/em andamento" />
        <Card titulo="Total registrado" valor={store.dados.length} descricao="todos os protocolos" />
      </section>

      <form className="panel form-grid" onSubmit={salvar}>
        <h2>{editandoId ? "Editar protocolo" : "Novo protocolo"}</h2>
        <label>Protocolo</label>
        <input placeholder="Digite o protocolo da OS" value={form.protocolo} onChange={(e) => setForm({ ...form, protocolo: e.target.value })} />
        <label>Descrição, opcional</label>
        <textarea placeholder="Observação sobre a OS..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="aberta">Aberta</option>
          <option value="em andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
        <div className="botoes esquerda">
          <button className="btn primary">{editandoId ? "Salvar edição" : "Salvar protocolo"}</button>
          {editandoId && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <div className="lista">
        {store.dados.map((item) => (
          <div className="panel item" key={item.id}>
            <div>
              <h3>Protocolo: {item.protocolo}</h3>
              <p>{item.descricao || "Sem descrição"}</p>
              <small>Status: {item.status} • {formatarData(item.criado_em)}</small>
            </div>
            <div className="botoes">
              {item.status !== "concluida" && (
                <button className="btn" onClick={() => store.atualizar(item.id, { status: "concluida" })}>Concluir</button>
              )}
              <button className="btn" onClick={() => editar(item)}>Editar</button>
              <button className="btn danger" onClick={() => store.remover(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
        {!store.dados.length && <div className="panel empty big">Nenhuma OS aberta registrada.</div>}
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

    const item = {
      ...form,
      data_inicio: inputParaISO(form.data_inicio),
      data_fim: inputParaISO(form.data_fim),
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
      descricao: item.descricao || "",
      data_inicio: item.data_inicio ? dataLocalParaInput(item.data_inicio) : hojeInput(),
      data_fim: item.data_fim ? dataLocalParaInput(item.data_fim) : "",
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
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  function limpar() {
    setForm({ setor: "", titulo: "", descricao: "", prazo: hojeInput(), status: "em andamento" });
    setEditandoId(null);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return alert("Digite o título.");

    const item = {
      ...form,
      prazo: inputParaISO(form.prazo),
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
      setor: item.setor || "",
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      prazo: item.prazo ? dataLocalParaInput(item.prazo) : hojeInput(),
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
        {store.dados.map((item) => {
          const tempo = formatarTempoRestante(item.prazo, agora);
          return (
            <div className="panel item" key={item.id}>
              <div>
                <h3>{item.titulo}</h3>
                <p>{item.descricao}</p>
                <small>{item.setor || "Sem setor"} • Prazo: {formatarData(item.prazo)} • {item.status}</small>
                {item.status !== "concluido" && (
                  <div className={`contador-inline ${tempo.classe}`}>⏱ {tempo.texto}</div>
                )}
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
          );
        })}
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

  const pendentes = registros.filter((r) => r.status !== "concluido");

  return (
    <>
      <Header titulo="Timer de prazos" subtitulo="Acompanhe os prazos dos registros em aberto." />

      <div className="lista">
        {pendentes.map((item) => {
          const tempo = formatarTempoRestante(item.prazo, agora);
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


function Perfil({ usuario, onAtualizar }) {
  const [nome, setNome] = useState(nomeUsuario(usuario));
  const [avatar, setAvatar] = useState(avatarUsuario(usuario));

  async function salvar(e) {
    e.preventDefault();
    await onAtualizar({ nome, avatar });
  }

  return (
    <>
      <Header titulo="Perfil" subtitulo="Escolha seu avatar. Essa escolha é individual para cada usuário." usuario={usuario} />

      <section className="grid-2">
        <form className="panel form-grid" onSubmit={salvar}>
          <h2>Meu perfil</h2>

          <label>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />

          <h3>Escolha seu avatar</h3>
          <div className="avatar-grid">
            {avatarOptions.map((opcao) => (
              <button
                type="button"
                key={opcao.id}
                className={avatar === opcao.src ? "avatar-option active" : "avatar-option"}
                onClick={() => setAvatar(opcao.src)}
              >
                <img src={opcao.src} alt={opcao.nome} />
                <span>{opcao.nome}</span>
              </button>
            ))}
          </div>

          <button className="btn primary">Salvar perfil</button>
        </form>

        <div className="panel perfil-preview">
          <h2>Prévia</h2>
          <img className="avatar-preview" src={avatar} alt="Avatar escolhido" />
          <h3>{nome || "Seu nome"}</h3>
          <p className="hint">Esse avatar aparecerá no menu lateral e na tela inicial.</p>
        </div>
      </section>
    </>
  );
}


function Configuracoes({ config, salvarSheetUrl }) {
  const [valor, setValor] = useState(config.sheetUrl || "");

  useEffect(() => {
    setValor(config.sheetUrl || "");
  }, [config.sheetUrl]);

  async function salvar(e) {
    e.preventDefault();
    const sheetUrl = extrairSrcIframe(valor);
    const ok = await salvarSheetUrl(sheetUrl);
    if (ok) alert("Escala compartilhada salva! Todos os usuários verão essa escala.");
  }

  return (
    <>
      <Header titulo="Configurações" subtitulo="Ajustes compartilhados do painel." />

      <form className="panel form-grid" onSubmit={salvar}>
        <h2>Google Sheets compartilhado</h2>
        <p className="hint">
          Cole aqui o link da planilha publicada ou o código iframe completo. Essa escala aparecerá para todos os usuários.
        </p>
        <textarea
          placeholder='<iframe src="https://docs.google.com/spreadsheets/..."></iframe>'
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button className="btn primary">Salvar escala para todos</button>
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

  const configStore = useConfigCompartilhada(usuario);
  const anotacoes = useTabela("anotacoes", usuario);
  const frases = useTabela("mensagens_rapidas", usuario);
  const links = useTabela("links_importantes", usuario);
  const osnoc = useTabela("os_noc", usuario);
  const osabertas = useTabela("ordens_servico", usuario);
  const eventos = useTabela("eventos", usuario);
  const registros = useTabela("registros", usuario);

  async function sair() {
    if (supabaseEnabled) await supabase.auth.signOut();
    localStorage.removeItem("usuario_demo");
    setUsuario(null);
  }

  async function atualizarUsuarioPerfil({ nome, avatar }) {
    if (supabaseEnabled && usuario?.id) {
      const { data, error } = await supabase.auth.updateUser({
        data: { nome, avatar },
      });

      if (error) {
        alert("Erro ao salvar perfil: " + error.message);
        return;
      }

      setUsuario(data.user);
      alert("Perfil salvo!");
      return;
    }

    const atualizado = { ...usuario, nome, avatar };
    setUsuario(atualizado);
    setLocal("usuario_demo", atualizado);
    alert("Perfil salvo!");
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
          osnoc={osnoc.dados}
          osabertas={osabertas.dados}
        />
      );
    }
    if (pagina === "anotacoes") return <Anotacoes store={anotacoes} />;
    if (pagina === "frases") return <FrasesProntas store={frases} />;
    if (pagina === "osnoc") return <OSNOC store={osnoc} />;
    if (pagina === "osabertas") return <OSAbertas store={osabertas} />;
    if (pagina === "links") return <LinksImportantes store={links} />;
    if (pagina === "escala") return <Escala config={configStore.config} />;
    if (pagina === "calendario") return <Calendario store={eventos} />;
    if (pagina === "eventos") return <Eventos store={registros} />;
    if (pagina === "timer") return <Timer registros={registros.dados} />;
    if (pagina === "perfil") return <Perfil usuario={usuario} onAtualizar={atualizarUsuarioPerfil} />;
    if (pagina === "config") return <Configuracoes config={configStore.config} salvarSheetUrl={configStore.salvarSheetUrl} />;
    return null;
  }, [pagina, usuario, anotacoes.dados, frases.dados, links.dados, osnoc.dados, osabertas.dados, eventos.dados, registros.dados, configStore.config]);

  if (!usuario) return <Login onLogin={setUsuario} />;

  return (
    <Layout usuario={usuario} onLogout={sair} pagina={pagina} setPagina={setPagina}>
      {conteudo}
    </Layout>
  );
}
