import { useEffect, useId, useRef, useState } from 'react';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import type { CategorySelectProps } from './CategorySelect';

/** A keyboard-accessible dropdown anchored directly below the category field. */
export default function CategorySelect({ label, value, options, onChange }: CategorySelectProps) {
  const { colors } = useThemePreferences();
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ offset: 0, viewport: 0, content: 0 });
  const updateScroll = () => {
    const element = list.current;
    if (element) setScroll({ offset: element.scrollTop, viewport: element.clientHeight, content: element.scrollHeight });
  };
  const maxScroll = Math.max(0, scroll.content - scroll.viewport);
  const trackHeight = Math.max(0, scroll.viewport - spacing.space8);
  const thumbHeight = scroll.content ? Math.min(trackHeight, Math.max(24, trackHeight * scroll.viewport / scroll.content)) : 0;
  const scrollAt = (clientY: number, track: HTMLDivElement) => {
    const travel = trackHeight - thumbHeight;
    if (list.current && travel > 0) list.current.scrollTop = Math.max(0, Math.min(1, (clientY - track.getBoundingClientRect().top - thumbHeight / 2) / travel)) * maxScroll;
  };
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);
  useEffect(() => {
    if (open) optionRefs.current[selected]?.focus();
  }, [open, selected]);
  useEffect(() => {
    if (!open || !list.current) return;
    updateScroll();
    const observer = new ResizeObserver(updateScroll);
    observer.observe(list.current);
    optionRefs.current.forEach(option => { if (option) observer.observe(option); });
    return () => observer.disconnect();
  }, [open, options]);
  return (
    <div ref={root} style={{ display: 'flex', flexDirection: 'column', gap: spacing.space4, minWidth: 0, position: 'relative', zIndex: open ? 20 : 0 }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
      }}
    >
      <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={menuId} aria-haspopup="listbox"
        onClick={() => setOpen(previous => !previous)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
        }}
        style={{ width: '100%', minWidth: 0, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space8, padding: `0 ${spacing.space8}px`, border: `1px solid ${open ? colors.focusRing : colors.border}`, borderRadius: radii.sm, background: colors.surface, color: colors.primary, fontWeight: 600, fontFamily: 'system-ui, sans-serif', fontSize: typography.small.fontSize, textAlign: 'left', cursor: 'pointer', outlineColor: colors.focusRing }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{options[selected]?.label}</span>
        <span aria-hidden="true" style={{ color: colors.textMuted }}>{open ? '▴' : '▾'}</span>
      </button>
      {open ? <div
        style={{ position: 'absolute', top: `calc(100% + ${spacing.space4}px)`, left: 0, right: 0, zIndex: 20, overflow: 'hidden', border: `1px solid ${colors.border}`, borderRadius: radii.sm, background: colors.surface }}
      >
        <div ref={list} onScroll={updateScroll} className="soberity-category-options" id={menuId} role="listbox" aria-label={label}
          style={{ maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'none', paddingRight: maxScroll ? spacing.space12 : 0 }}
        >
        {options.map((option, index) => <button
          key={option.value} ref={element => { optionRefs.current[index] = element; }}
          type="button" role="option" aria-selected={option.value === value}
          onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}
          onKeyDown={event => {
            const next = event.key === 'ArrowDown' ? (index + 1) % options.length : event.key === 'ArrowUp' ? (index + options.length - 1) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null;
            if (next !== null) { event.preventDefault(); optionRefs.current[next]?.focus(); }
          }}
          style={{ width: '100%', minHeight: 40, display: 'block', padding: spacing.space8, border: 0, background: option.value === value ? colors.surfaceAlt : colors.surface, color: colors.primary, fontWeight: option.value === value ? 600 : 400, lineHeight: `${typography.small.lineHeight}px`, fontFamily: 'system-ui, sans-serif', fontSize: typography.small.fontSize, textAlign: 'left', cursor: 'pointer', outlineColor: colors.focusRing, outlineOffset: -2 }}
        >{option.label}{option.value === value ? ' ✓' : ''}</button>)}
        </div>
        {maxScroll > 0 ? <div role="scrollbar" tabIndex={0} aria-label={label} aria-orientation="vertical" aria-controls={menuId} aria-valuemin={0} aria-valuemax={maxScroll} aria-valuenow={Math.round(scroll.offset)}
          onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); scrollAt(event.clientY, event.currentTarget); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) scrollAt(event.clientY, event.currentTarget); }}
          onKeyDown={event => {
            if (!list.current) return;
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              list.current.scrollTop = event.key === 'Home' ? 0 : event.key === 'End' ? maxScroll : scroll.offset + (event.key.includes('Down') ? 1 : -1) * (event.key.startsWith('Page') ? scroll.viewport : 40);
            }
          }}
          style={{ position: 'absolute', top: spacing.space4, right: 2, bottom: spacing.space4, width: 8, background: colors.surfaceAlt, borderRadius: radii.pill, touchAction: 'none', cursor: 'pointer', outlineColor: colors.focusRing }}
        >
          <div style={{ position: 'absolute', left: 1, right: 1, height: thumbHeight, top: Math.min(1, Math.max(0, scroll.offset / maxScroll)) * (trackHeight - thumbHeight), borderRadius: radii.pill, background: colors.primary, pointerEvents: 'none' }} />
        </div> : null}
      </div> : null}
    </div>
  );
}
