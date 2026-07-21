import React from 'react';

interface CustomizationsRendererProps {
  customizations: string[];
  listClassName?: string;
  itemClassName?: string;
  bulletClassName?: string;
  showIcon?: boolean;
}

export const CustomizationsRenderer: React.FC<CustomizationsRendererProps> = ({
  customizations,
  listClassName = "flex flex-col gap-0.5 mt-1.5 pl-1",
  itemClassName = "text-[10px] font-bold text-gray-500 flex items-start gap-1 uppercase leading-tight",
  bulletClassName = "text-gray-400 mt-[1px]",
  showIcon = true
}) => {
  if (!customizations || customizations.length === 0) return null;

  return (
    <ul className={listClassName}>
      {customizations.flatMap(c => {
        let isGuisado = false;
        let text = c;

        // Check if it's already marked as Guisados
        if (text.match(/^Guisados:\s*/i)) {
          isGuisado = true;
          text = text.replace(/^Guisados:\s*/i, '');
        }

        // Try to match the legacy format from layout_2_cantidades or similar
        // e.g. "2 CHICHARRÓN EN SALSA VERDE, 1 CHORIZO CON PAPA"
        const guisadoMatches = [...text.matchAll(/(\d+)\s+([^,\d]+)/g)];
        
        // If we found multiple quantity+name pairs OR it's explicitly marked as guisado
        if (isGuisado || (guisadoMatches.length > 0 && text.match(/^\d+\s+[^,]+/))) {
          // If it was explicitly marked, and contains commas, split by comma to be safe (since it uses ' (X pz)' pattern)
          if (isGuisado && text.includes(',')) {
            return [{ isGuisado: true, items: text.split(',').map(s => s.trim()).filter(Boolean) }];
          }
          
          // Otherwise use regex matches to extract the guisados perfectly
          return [{ isGuisado: true, items: guisadoMatches.map(m => m[0].trim()) }];
        }

        // Support for Extras list (like in Tortas)
        if (text.match(/^Extras:\s*/i)) {
          text = text.replace(/^Extras:\s*/i, '');
          if (text.includes(',')) {
             return [{ isExtras: true, isGuisado: false, isSin: false, items: text.split(',').map(s => s.trim()).filter(Boolean) }];
          }
          return [{ isExtras: true, isGuisado: false, isSin: false, items: [text] }];
        }

        // Support for Sin: list
        if (text.match(/^Sin:\s*/i)) {
          text = text.replace(/^Sin:\s*/i, '');
          if (text.includes(',')) {
             return [{ isExtras: false, isGuisado: false, isSin: true, items: text.split(',').map(s => s.trim()).filter(Boolean) }];
          }
          return [{ isExtras: false, isGuisado: false, isSin: true, items: [text] }];
        }

        // Standard custom option
        return [{ isExtras: false, isGuisado: false, isSin: false, items: [text] }];
      }).map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {group.isGuisado && (
            <li className="text-[10px] font-black text-amber-600 dark:text-amber-500 flex items-center gap-1 uppercase tracking-wider mt-1 mb-0.5">
              {showIcon && <span>⚡</span>} Guisos:
            </li>
          )}
          
          {group.isSin && (
            <li className="text-[10px] font-black text-rose-600 dark:text-rose-500 flex items-center gap-1 uppercase tracking-wider mt-1 mb-0.5">
              {showIcon && <span>❌</span>} Sin:
            </li>
          )}
          
          {group.isExtras && (
            <li className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-1 uppercase tracking-wider mt-1 mb-0.5">
              {showIcon && <span>➕</span>} Extras:
            </li>
          )}
          
          {group.items.map((part, ci) => {
            let displayText = part;
            
            // Format "Chicharrón en salsa verde (2 pz)" -> "2 × Chicharrón en salsa verde"
            const match = part.match(/(.+?)\s*\(\s*(\d+)\s*pz\s*\)/i);
            if (match) {
              displayText = `${match[2]} × ${match[1].trim()}`;
            } else {
              // Format "2 CHICHARRÓN EN SALSA VERDE" -> "2 × CHICHARRÓN EN SALSA VERDE"
              const m2 = part.match(/^(\d+)\s+(.+)$/);
              if (m2) {
                displayText = `${m2[1]} × ${m2[2].trim()}`;
              }
            }

            return (
              <li key={ci} className={itemClassName}>
                {showIcon && <span className={bulletClassName}>•</span>}
                <span>{displayText}</span>
              </li>
            );
          })}
        </React.Fragment>
      ))}
    </ul>
  );
};
