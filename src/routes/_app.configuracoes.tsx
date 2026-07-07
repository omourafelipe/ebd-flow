import { createFileRoute } from "@tanstack/react-router";
import { useEbdStore, updateConfiguracoes, resetEbdStore, clearEbdStore } from "@/lib/store";
import { useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Building,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const store = useEbdStore();
  const [igrejaNome, setIgrejaNome] = useState(store.configuracoes.nome_igreja);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);

  const handleSaveIgreja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!igrejaNome.trim()) {
      toast.error("O nome da igreja não pode estar vazio.");
      return;
    }

    try {
      updateConfiguracoes(igrejaNome);
      toast.success("Nome da igreja atualizado!");
    } catch {
      toast.error("Erro ao atualizar configurações.");
    }
  };

  const handleResetDatabase = () => {
    try {
      resetEbdStore();
      setIgrejaNome("Igreja Evangélica da EBD");
      toast.success("Banco de dados restaurado para os dados padrões.");
      setIsResetOpen(false);
    } catch {
      toast.error("Erro ao restaurar banco de dados.");
    }
  };

  const handleClearDatabase = () => {
    try {
      clearEbdStore();
      setIgrejaNome("Igreja Evangélica da EBD");
      toast.success("Banco de dados limpo com sucesso.");
      setIsClearOpen(false);
    } catch {
      toast.error("Erro ao limpar banco de dados.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Configurações</h3>
        <p className="text-xs text-slate-500 font-medium">Ajustes do sistema e manutenção do banco de dados local.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Church configuration form */}
        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Building className="h-4.5 w-4.5 text-primary" strokeWidth={2.25} />
              Identidade do Sistema
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">Defina o nome da igreja que aparecerá no cabeçalho.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <form onSubmit={handleSaveIgreja} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="igreja" className="text-xs font-semibold text-slate-600">Nome da Igreja / Congregação</Label>
                <Input
                  id="igreja"
                  value={igrejaNome}
                  onChange={(e) => setIgrejaNome(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                  placeholder="Ex: Igreja Evangélica Betel"
                />
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft"
              >
                <Save className="h-4 w-4" />
                Salvar Nome
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Database maintenance */}
        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
              Manutenção e Backup
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">Ações de redefinição e limpeza de dados.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="space-y-3">
              {/* Reset to defaults button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800">Restaurar Dados Padrões</h5>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-0.5">Substitui seus dados atuais pelos dados fictícios de demonstração.</p>
                </div>
                <Button
                  onClick={() => setIsResetOpen(true)}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1.5 h-9 px-3.5 cursor-pointer flex-shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  Restaurar
                </Button>
              </div>

              {/* Clear database button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/30 border border-red-50/50 p-3 rounded-xl">
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-red-800">Limpar Banco de Dados</h5>
                  <p className="text-[10px] text-red-600/70 font-semibold leading-normal mt-0.5">Apaga todas as classes, alunos, chamadas e cursos salvos.</p>
                </div>
                <Button
                  onClick={() => setIsClearOpen(true)}
                  variant="destructive"
                  className="bg-red-50 hover:bg-red-100/70 text-red-600 font-semibold rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1.5 h-9 px-3.5 cursor-pointer shadow-none flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  Limpar Tudo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System info */}
        <Card className="border-none shadow-soft bg-white rounded-2xl md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-blue-500" />
              Sobre o EBD Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-xs font-medium text-slate-500 leading-relaxed space-y-2.5">
            <p>
              O <strong>EBD Flow</strong> foi desenvolvido seguindo os princípios rígidos de UX do produto:
              ser extremamente simples, exigir pouca digitação, e permitir o registro de uma chamada completa em menos de dois minutos pelo smartphone.
            </p>
            <div className="border-t border-slate-50 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Módulo: Gestão Dominical</span>
              <span>Versão do Software: 1.0.0</span>
              <span>Status: Protótipo Local Persistente</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESET CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              Restaurar Dados Padrões?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Todos os seus registros atuais de alunos, classes, presença e cursos serão substituídos pela base de dados de demonstração contendo dados fictícios organizados. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold border-slate-100 hover:bg-slate-50 text-slate-600 mt-0 cursor-pointer h-9 px-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer h-9 px-4"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CLEAR DATABASE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Apagar Tudo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação é permanente e irreversível. Toda a sua base de dados atual, incluindo alunos, presenças históricas, classes e cursos cadastrados, será excluída completamente do armazenamento do navegador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold border-slate-100 hover:bg-slate-50 text-slate-600 mt-0 cursor-pointer h-9 px-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearDatabase}
              className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer h-9 px-4"
            >
              Apagar Banco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
