import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Cpu, Info, CheckCircle2, XCircle, Wrench } from "lucide-react";
import "./pc_builder.css";

/* ──────────────────────────────────────────────────────────────
   PC BUILDER SIMULATOR
   A hands-on, drag-and-drop teaching game for Module 4
   (Hardware Components & Basic PC-Building).

   Pick a part from each category, drop it into the build, and the
   System Validation panel checks real compatibility rules in
   real time — form factor, CPU socket, RAM generation, GPU
   clearance, storage interface and PSU wattage.
   ────────────────────────────────────────────────────────────── */

// Form-factor size ranking. A case fits its own size and anything smaller.
const FF_RANK = { "Mini-ITX": 0, mATX: 1, ATX: 2, "E-ATX": 3 };

// Order the category slots appear in.
const CATEGORY_ORDER = ["case", "motherboard", "cpu", "gpu", "ram", "storage", "psu"];

const CATEGORY_LABEL = {
  case: "Case",
  motherboard: "Motherboard",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage",
  psu: "PSU",
};

const CATEGORY_INFO = {
  case: "The enclosure that houses all PC components. Its form factor (ATX, mATX, Mini-ITX) determines which motherboards fit and how much room the graphics card has.",
  motherboard: "The main circuit board that connects everything. Its socket sets which CPUs fit, and its slots set the RAM generation (DDR4/DDR5) it supports.",
  cpu: "The processor — the brain of the PC. It must match the motherboard's socket exactly (AM4, AM5, LGA1700 …).",
  gpu: "The graphics card that renders images. It draws the most power and must physically fit the case's maximum GPU length.",
  ram: "Short-term memory the CPU works from. Its generation (DDR4 or DDR5) must match what the motherboard supports.",
  storage: "Long-term storage for the OS, apps and files. NVMe drives use an M.2 slot; SATA drives use a cable.",
  psu: "The power supply. Its wattage must comfortably cover the total draw of every component, with headroom.",
};

// ── Parts catalogue ─────────────────────────────────────────────
const PARTS = {
  case: [
    { id: "nzxt-h510", name: "NZXT H510", spec: "mATX · Max GPU 330mm", maxFF: "mATX", maxGpu: 330 },
    { id: "corsair-obsidian", name: "Corsair Obsidian", spec: "ATX · Max GPU 400mm", maxFF: "ATX", maxGpu: 400 },
    { id: "meshify-c", name: "Fractal Design Meshify C", spec: "ATX · Max GPU 420mm", maxFF: "ATX", maxGpu: 420 },
    { id: "corsair-7000d", name: "Corsair 7000D Airflow", spec: "E-ATX · Max GPU 450mm", maxFF: "E-ATX", maxGpu: 450 },
    { id: "evolv-shift", name: "Phanteks Evolv Shift 2", spec: "Mini-ITX · Max GPU 335mm", maxFF: "Mini-ITX", maxGpu: 335 },
    { id: "nr200", name: "Cooler Master NR200", spec: "Mini-ITX · Max GPU 330mm", maxFF: "Mini-ITX", maxGpu: 330 },
  ],
  motherboard: [
    { id: "prime-b550m", name: "ASUS Prime B550M", spec: "mATX · AM4 · DDR4", ff: "mATX", socket: "AM4", ram: "DDR4", m2: 1 },
    { id: "strix-b550f", name: "ASUS ROG Strix B550-F", spec: "ATX · AM4 · DDR4", ff: "ATX", socket: "AM4", ram: "DDR4", m2: 2 },
    { id: "b450m-ds3h", name: "Gigabyte B450M DS3H", spec: "mATX · AM4 · DDR4", ff: "mATX", socket: "AM4", ram: "DDR4", m2: 1 },
    { id: "crosshair-viii", name: "ASUS ROG Crosshair VIII", spec: "E-ATX · AM4 · DDR4", ff: "E-ATX", socket: "AM4", ram: "DDR4", m2: 3 },
    { id: "b550a-pro", name: "MSI B550-A PRO", spec: "ATX · AM4 · DDR4", ff: "ATX", socket: "AM4", ram: "DDR4", m2: 2 },
    { id: "b760i-edge", name: "MSI MPG B760I Edge", spec: "Mini-ITX · LGA1700 · DDR5", ff: "Mini-ITX", socket: "LGA1700", ram: "DDR5", m2: 1 },
    { id: "z690-aorus", name: "Gigabyte Z690 AORUS", spec: "E-ATX · LGA1700 · DDR5", ff: "E-ATX", socket: "LGA1700", ram: "DDR5", m2: 3 },
    { id: "x670e-hero", name: "ASUS ROG X670E Hero", spec: "ATX · AM5 · DDR5", ff: "ATX", socket: "AM5", ram: "DDR5", m2: 4 },
  ],
  cpu: [
    { id: "r5-5600x", name: "AMD Ryzen 5 5600X", spec: "AM4 · 6 cores · 65W", socket: "AM4", tdp: 65 },
    { id: "i7-12700k", name: "Intel Core i7-12700K", spec: "LGA1700 · 12 cores · 125W", socket: "LGA1700", tdp: 125 },
    { id: "i5-12600k", name: "Intel Core i5-12600K", spec: "LGA1700 · 10 cores · 125W", socket: "LGA1700", tdp: 125 },
    { id: "r7-7800x3d", name: "AMD Ryzen 7 7800X3D", spec: "AM5 · 8 cores · 120W", socket: "AM5", tdp: 120 },
    { id: "r5-7600x", name: "AMD Ryzen 5 7600X", spec: "AM5 · 6 cores · 105W", socket: "AM5", tdp: 105 },
  ],
  gpu: [
    { id: "rtx-3060", name: "NVIDIA RTX 3060", spec: "12GB · 285mm · 170W", length: 285, tdp: 170 },
    { id: "rtx-4090", name: "NVIDIA RTX 4090", spec: "24GB · 360mm · 450W", length: 360, tdp: 450 },
    { id: "rx-7800xt", name: "AMD Radeon RX 7800 XT", spec: "16GB · 267mm · 263W", length: 267, tdp: 263 },
    { id: "rtx-4070", name: "NVIDIA RTX 4070", spec: "12GB · 240mm · 200W", length: 240, tdp: 200 },
    { id: "rx-7600", name: "AMD Radeon RX 7600", spec: "8GB · 204mm · 165W", length: 204, tdp: 165 },
    { id: "rx-6600", name: "AMD Radeon RX 6600", spec: "8GB · 220mm · 132W", length: 220, tdp: 132 },
  ],
  ram: [
    { id: "team-xtreem", name: "Team Xtreem ARGB", spec: "DDR4 · 32GB · 3600MHz", ram: "DDR4", tdp: 8 },
    { id: "vengeance-ddr4", name: "Corsair Vengeance", spec: "DDR4 · 16GB · 3200MHz", ram: "DDR4", tdp: 6 },
    { id: "dominator-ddr5", name: "Corsair Dominator RGB", spec: "DDR5 · 32GB · 6400MHz", ram: "DDR5", tdp: 10 },
    { id: "apacer-ddr5", name: "Apacer Panther", spec: "DDR5 · 16GB · 6000MHz", ram: "DDR5", tdp: 8 },
  ],
  storage: [
    { id: "970-evo", name: "Samsung 970 EVO", spec: "M.2 NVMe · 1TB", iface: "M.2", tdp: 6 },
    { id: "barracuda", name: "Seagate Barracuda", spec: "SATA · 2TB", iface: "SATA", tdp: 8 },
    { id: "sn570", name: "WD Blue SN570", spec: "M.2 NVMe · 500GB", iface: "M.2", tdp: 5 },
    { id: "mx500", name: "Crucial MX500", spec: "SATA · 1TB", iface: "SATA", tdp: 6 },
    { id: "firecuda-530", name: "Seagate FireCuda 530", spec: "M.2 NVMe · 2TB", iface: "M.2", tdp: 7 },
  ],
  psu: [
    { id: "rm750x", name: "Corsair RM750x", spec: "750W · 80+ Gold", watts: 750 },
    { id: "evga-500", name: "EVGA 500W", spec: "500W · 80+ Bronze", watts: 500 },
    { id: "focus-gx850", name: "Seasonic Focus GX-850", spec: "850W · 80+ Gold", watts: 850 },
    { id: "straight-650", name: "be quiet! Straight Power 650W", spec: "650W · 80+ Platinum", watts: 650 },
    { id: "mwe-550", name: "Cooler Master MWE 550", spec: "550W · 80+ Gold", watts: 550 },
  ],
};

// Baseline draw for board, fans and peripherals not otherwise counted.
const BASE_POWER = 90;

export default function PCBuilder() {
  const navigate = useNavigate();
  const [build, setBuild] = useState({}); // category -> part
  const [openInfo, setOpenInfo] = useState(null); // category tooltip
  const [dragCat, setDragCat] = useState(null); // category being dragged
  const [built, setBuilt] = useState(false);
  const dropRef = useRef(null);

  // ── Selection helpers ──
  const selectPart = (category, part) => {
    setBuild((b) => ({ ...b, [category]: part }));
    setBuilt(false);
  };
  const removePart = (category) => {
    setBuild((b) => {
      const next = { ...b };
      delete next[category];
      return next;
    });
    setBuilt(false);
  };
  const reset = () => {
    setBuild({});
    setBuilt(false);
  };

  // ── Drag & drop ──
  const onDragStart = (e, category, part) => {
    setDragCat(category);
    e.dataTransfer.setData("text/plain", JSON.stringify({ category, id: part.id }));
    e.dataTransfer.effectAllowed = "copy";
  };
  const onDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("pcb-dragover");
    try {
      const { category, id } = JSON.parse(e.dataTransfer.getData("text/plain"));
      const part = PARTS[category]?.find((p) => p.id === id);
      if (part) selectPart(category, part);
    } catch {
      /* ignore malformed payloads */
    }
    setDragCat(null);
  };

  // ── Power maths ──
  const totalPower = useMemo(() => {
    return CATEGORY_ORDER.reduce((sum, cat) => sum + (build[cat]?.tdp || 0), 0) + BASE_POWER;
  }, [build]);
  const recommendedPsu = Math.ceil((totalPower * 1.4) / 50) * 50;

  // ── Compatibility checks ──
  const checks = useMemo(() => {
    const c = build.case, mb = build.motherboard, cpu = build.cpu,
      gpu = build.gpu, ram = build.ram, sto = build.storage, psu = build.psu;
    const list = [];

    if (c && mb) {
      const ok = FF_RANK[c.maxFF] >= FF_RANK[mb.ff];
      list.push({
        ok,
        label: ok
          ? `${mb.ff} board fits the ${c.maxFF} case`
          : `${mb.ff} board is too large for the ${c.maxFF} case`,
      });
    }
    if (mb && cpu) {
      const ok = mb.socket === cpu.socket;
      list.push({
        ok,
        label: ok
          ? `CPU socket (${cpu.socket}) matches the motherboard`
          : `CPU socket (${cpu.socket}) ≠ motherboard socket (${mb.socket})`,
      });
    }
    if (mb && ram) {
      const ok = mb.ram === ram.ram;
      list.push({
        ok,
        label: ok
          ? `${ram.ram} memory is supported by the motherboard`
          : `${ram.ram} memory not supported — board uses ${mb.ram}`,
      });
    }
    if (c && gpu) {
      const ok = gpu.length <= c.maxGpu;
      list.push({
        ok,
        label: ok
          ? `GPU (${gpu.length}mm) clears the case (${c.maxGpu}mm)`
          : `GPU (${gpu.length}mm) too long for the case (${c.maxGpu}mm max)`,
      });
    }
    if (mb && sto) {
      const ok = sto.iface !== "M.2" || (mb.m2 || 0) >= 1;
      list.push({
        ok,
        label: ok
          ? `${sto.iface} storage connects to the motherboard`
          : `No M.2 slot on the motherboard for this drive`,
      });
    }
    if (psu) {
      const ok = psu.watts >= totalPower;
      list.push({
        ok,
        label: ok
          ? `PSU ${psu.watts}W covers the ~${totalPower}W draw`
          : `PSU ${psu.watts}W is under the ~${totalPower}W draw`,
      });
    }
    return list;
  }, [build, totalPower]);

  const chosenCount = CATEGORY_ORDER.filter((c) => build[c]).length;
  const allChosen = chosenCount === CATEGORY_ORDER.length;
  const allCompatible = checks.length > 0 && checks.every((c) => c.ok);
  const canBuild = allChosen && allCompatible;

  return (
    <div className="pcb-root">
      {/* ── Top bar ── */}
      <header className="pcb-topbar">
        <button className="pcb-icon-btn" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="pcb-title">
          <Cpu size={20} /> PC Builder Simulator
        </h1>
        <button className="pcb-icon-btn" onClick={reset} title="Reset build">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </header>

      <div className="pcb-layout">
        {/* ── Left: available components ── */}
        <aside className="pcb-catalog">
          <h2 className="pcb-catalog-title">Available Components</h2>
          {CATEGORY_ORDER.map((cat) => (
            <section key={cat} className="pcb-cat">
              <div className="pcb-cat-head">
                <span>{CATEGORY_LABEL[cat]}</span>
                <button
                  className="pcb-info"
                  onMouseEnter={() => setOpenInfo(cat)}
                  onMouseLeave={() => setOpenInfo(null)}
                  onClick={() => setOpenInfo((o) => (o === cat ? null : cat))}
                  aria-label={`About ${CATEGORY_LABEL[cat]}`}
                >
                  <Info size={13} />
                  {openInfo === cat && <span className="pcb-tooltip">{CATEGORY_INFO[cat]}</span>}
                </button>
              </div>
              {PARTS[cat].map((part) => {
                const active = build[cat]?.id === part.id;
                return (
                  <button
                    key={part.id}
                    className={`pcb-part ${active ? "is-active" : ""}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, cat, part)}
                    onDragEnd={() => setDragCat(null)}
                    onClick={() => selectPart(cat, part)}
                  >
                    <span className="pcb-part-name">{part.name}</span>
                    <span className="pcb-part-spec">{part.spec}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </aside>

        {/* ── Center: build bench ── */}
        <main className="pcb-bench">
          <div
            ref={dropRef}
            className="pcb-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              dropRef.current?.classList.add("pcb-dragover");
            }}
            onDragLeave={() => dropRef.current?.classList.remove("pcb-dragover")}
            onDrop={onDrop}
          >
            {chosenCount === 0 && (
              <div className="pcb-empty">
                <Wrench size={40} />
                <p>Drag a component here — or click it — to start building.</p>
              </div>
            )}

            {/* PC case illustration */}
            <div className={`pcb-case ${build.case ? "has-case" : "ghost"}`}>
              <div className="pcb-case-tag">
                {build.case ? build.case.name : "Case"}
              </div>

              <div className="pcb-motherboard">
                <Slot cat="motherboard" part={build.motherboard} onRemove={removePart} dim={dragCat} />
                <div className="pcb-mb-inner">
                  <Slot cat="cpu" part={build.cpu} onRemove={removePart} dim={dragCat} square />
                  <Slot cat="ram" part={build.ram} onRemove={removePart} dim={dragCat} tall />
                  <Slot cat="storage" part={build.storage} onRemove={removePart} dim={dragCat} thin />
                </div>
              </div>

              <Slot cat="gpu" part={build.gpu} onRemove={removePart} dim={dragCat} wide />
              <Slot cat="psu" part={build.psu} onRemove={removePart} dim={dragCat} wide />
            </div>
          </div>

          <div className="pcb-actions">
            <button
              className={`pcb-build-btn ${canBuild ? "ready" : ""}`}
              disabled={!canBuild}
              onClick={() => setBuilt(true)}
            >
              {built ? "✓ PC Built!" : "Build PC"}
            </button>
            {built && (
              <span className="pcb-built-msg">
                Nice — a fully compatible ~{totalPower}W system. 🎉
              </span>
            )}
          </div>
        </main>

        {/* ── Right: build summary + validation ── */}
        <aside className="pcb-side">
          <section className="pcb-summary">
            <h2 className="pcb-side-title">Current Build</h2>
            <ul className="pcb-summary-list">
              {CATEGORY_ORDER.map((cat) => (
                <li key={cat}>
                  <span className="pcb-summary-cat">{CATEGORY_LABEL[cat]}</span>
                  <span className={`pcb-summary-val ${build[cat] ? "set" : ""}`}>
                    {build[cat] ? build[cat].name : "Not selected"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pcb-power">
              <span>Estimated draw</span>
              <strong>{chosenCount ? `~${totalPower}W` : "—"}</strong>
            </div>
            {(build.cpu || build.gpu) && (
              <div className="pcb-power sub">
                <span>Recommended PSU</span>
                <strong>{recommendedPsu}W+</strong>
              </div>
            )}
          </section>

          <section className="pcb-validation">
            <h2 className="pcb-side-title">System Validation</h2>
            {checks.length === 0 ? (
              <p className="pcb-hint">Add at least two matching parts to see compatibility checks.</p>
            ) : (
              <>
                <ul className="pcb-check-list">
                  {checks.map((chk, i) => (
                    <li key={i} className={chk.ok ? "ok" : "bad"}>
                      {chk.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>{chk.label}</span>
                    </li>
                  ))}
                </ul>
                <div className={`pcb-verdict ${allCompatible ? "ok" : "bad"}`}>
                  {allCompatible
                    ? allChosen
                      ? "All components are compatible."
                      : "Compatible so far — keep going."
                    : "Incompatibility detected — check the red items."}
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

// ── A single build slot on the bench ──
function Slot({ cat, part, onRemove, square, tall, thin, wide }) {
  const cls = [
    "pcb-slot",
    part ? "filled" : "open",
    square ? "square" : "",
    tall ? "tall" : "",
    thin ? "thin" : "",
    wide ? "wide" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} data-cat={cat}>
      {part ? (
        <>
          <span className="pcb-slot-cat">{CATEGORY_LABEL[cat]}</span>
          <span className="pcb-slot-name">{part.name}</span>
          <button
            className="pcb-slot-remove"
            onClick={() => onRemove(cat)}
            title={`Remove ${CATEGORY_LABEL[cat]}`}
          >
            ×
          </button>
        </>
      ) : (
        <span className="pcb-slot-ph">{CATEGORY_LABEL[cat]}</span>
      )}
    </div>
  );
}
