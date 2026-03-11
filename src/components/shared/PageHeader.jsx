export default function PageHeader({ icon, title, description, actions = null }) {
  return (
    <div className="mb-8 flex flex-col gap-5 rounded-[24px] border border-white/65 bg-white/76 px-5 py-5 shadow-[0_18px_46px_rgba(28,20,55,0.08)] backdrop-blur-xl md:flex-row md:items-start md:justify-between md:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          {icon}
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">LangFlow</div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-foreground md:text-[32px]">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground md:text-[14px]">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
