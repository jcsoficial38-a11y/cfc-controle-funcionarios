import React from 'react';
import { Sparkles, Eye, Compass } from 'lucide-react';

interface SkeuomorphicBinderProps {
  is3DTilt: boolean;
  onToggle3DTilt: () => void;
  children: React.ReactNode;
}

export const SkeuomorphicBinder: React.FC<SkeuomorphicBinderProps> = ({
  is3DTilt,
  onToggle3DTilt,
  children,
}) => {
  // Quantidade de anéis metálicos do fichário
  const ringsCount = 8;

  return (
    <div className="w-full perspective-container flex flex-col items-center justify-center py-4 px-2 sm:px-4">
      {/* Barra de controle de visualização 3D skeuomórfica */}
      <div className="w-full max-w-6xl mb-3 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="font-serif italic font-medium">Fichário Executivo StaffControl Pro</span>
        </div>

        {/* Botão de Alternar 3D Tilt / Modo Plano */}
        <button
          type="button"
          onClick={onToggle3DTilt}
          title={is3DTilt ? 'Alternar para Visão Plana 2D' : 'Alternar para Visão 3D Inclinada'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
            is3DTilt
              ? 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {is3DTilt ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{is3DTilt ? 'Vista 3D Inclinada (Ativa)' : 'Vista 2D Plana'}</span>
        </button>
      </div>

      {/* Caderno / Fichário Físico 3D */}
      <div
        className={`relative w-full max-w-6xl transition-all duration-500 rounded-3xl ${
          is3DTilt ? 'binder-3d-tilt shadow-[0_30px_70px_rgba(0,0,0,0.28)]' : 'binder-flat shadow-2xl'
        }`}
      >
        {/* Capa Traseira de Couro (Borda protetora de luxo) */}
        <div className="absolute inset-0 -m-3 sm:-m-4.5 rounded-3xl bg-gradient-to-br from-amber-950 via-[#26150b] to-[#120a05] dark:from-slate-900 dark:via-zinc-950 dark:to-black shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-amber-900/40 leather-stitch pointer-events-none">
          {/* Costura artesanal visível ao redor */}
          <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-dashed border-amber-600/25 pointer-events-none" />
        </div>

        {/* Camadas de folhas inferiores simulando espessura do maço de papel */}
        <div className="absolute inset-0 translate-y-1.5 sm:translate-y-2 translate-x-1 sm:translate-x-1.5 rounded-2xl bg-amber-100/40 dark:bg-slate-800/60 pointer-events-none" />
        <div className="absolute inset-0 translate-y-1 sm:translate-y-1 translate-x-0.5 sm:translate-x-1 rounded-2xl bg-amber-100/70 dark:bg-slate-800/80 pointer-events-none" />

        {/* Folha Principal do Caderno / Fichário */}
        <div className="relative rounded-2xl bg-[#fffdf9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-amber-900/20 dark:border-slate-800 overflow-hidden paper-lined min-h-[750px] flex">
          {/* Borda Esquerda com Argolas / Espiral Metálico Cromado */}
          <div className="w-12 sm:w-16 bg-gradient-to-r from-amber-950/20 via-amber-900/10 to-transparent dark:from-black/60 dark:to-transparent border-r border-amber-900/15 dark:border-slate-800/80 flex flex-col justify-around items-center py-8 shrink-0 relative z-20">
            {Array.from({ length: ringsCount }).map((_, i) => (
              <div key={i} className="relative flex items-center justify-center my-3">
                {/* Furo do Papel (sombra interna) */}
                <div className="w-4.5 h-4.5 rounded-full paper-hole" />
                {/* Argola Metálica Cromada 3D */}
                <div className="absolute -left-3 sm:-left-4 w-7 sm:w-9 h-3.5 rounded-full chrome-ring" />
              </div>
            ))}
          </div>

          {/* Área Útil de Conteúdo da Página */}
          <div className="flex-1 p-4 sm:p-7 sm:pl-6 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
