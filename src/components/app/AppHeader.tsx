import { useState, useEffect, useRef } from "react";
import { BookOpen, LogOut, Search, X, ChevronRight } from "lucide-react";
import { getInitials, getFormattedDate } from "@/lib/app-shell-utils";
import { useEbdStore } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  churchName: string;
  userName: string;
  onLogout: () => void;
}

export function AppHeader({ churchName, userName, onLogout }: AppHeaderProps) {
  const store = useEbdStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<{
    classes: any[];
    pessoas: any[];
    cursos: any[];
  }>({ classes: [], pessoas: [], cursos: [] });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ classes: [], pessoas: [], cursos: [] });
      return;
    }
    const query = debouncedQuery.toLowerCase().trim();

    const matchedClasses = store.classes.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.professor && c.professor.toLowerCase().includes(query)) ||
        (c.departamento && c.departamento.toLowerCase().includes(query)) ||
        (c.sala && c.sala.toLowerCase().includes(query))
    );

    const matchedPessoas = store.alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(query) ||
        (a.email && a.email.toLowerCase().includes(query)) ||
        (a.telefone && a.telefone.includes(query))
    );

    const matchedCursos = store.cursos.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.professor && c.professor.toLowerCase().includes(query)) ||
        (c.descricao && c.descricao.toLowerCase().includes(query))
    );

    setResults({
      classes: matchedClasses.slice(0, 3),
      pessoas: matchedPessoas.slice(0, 3),
      cursos: matchedCursos.slice(0, 3),
    });
  }, [debouncedQuery, store]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results.classes.length > 0 || results.pessoas.length > 0 || results.cursos.length > 0;

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Logo Indicator */}
        <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <BookOpen className="h-4.5 w-4.5" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate max-w-[100px] sm:max-w-none">
            {churchName}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">Escola Bíblica</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-xs sm:max-w-sm mx-2 sm:mx-4" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-8.5 pr-7 rounded-xl border-slate-100 text-xs py-3 h-8.5 bg-slate-50/50 focus-visible:ring-primary/20 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isOpen && hasResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-elevated border border-slate-100 max-h-80 overflow-y-auto z-50 p-1.5 space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-150">
            {results.classes.length > 0 && (
              <div>
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Classes</div>
                {results.classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      navigate({ to: "/classes", search: { detalhe: c.id } });
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{c.nome}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">Prof: {c.professor}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}

            {results.pessoas.length > 0 && (
              <div>
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pessoas</div>
                {results.pessoas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate({ to: "/alunos", search: { detalhe: p.id } });
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{p.nome}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {p.email || p.telefone || "Sem contato"}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}

            {results.cursos.length > 0 && (
              <div>
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cursos</div>
                {results.cursos.map((cr) => (
                  <button
                    key={cr.id}
                    onClick={() => {
                      navigate({ to: "/cursos", search: { detalhe: cr.id } });
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{cr.nome}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        Prof: {cr.professor || "Sem prof."}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 hidden sm:inline-block">
          {getFormattedDate()}
        </span>
        <div className="h-8.5 w-8.5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 flex-shrink-0">
          {getInitials(userName)}
        </div>
        <button
          onClick={onLogout}
          title="Sair"
          aria-label="Sair do sistema"
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
