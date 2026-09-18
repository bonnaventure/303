import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';
import './index.css';

/* ============================================================
   KNOB COMPONENT
   ============================================================ */
function Knob({ label, value, onChange, size = 'sm', endLabels }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'lg';
  endLabels?: [string, string];
}) {
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startVal: value };
  }, [value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const sensitivity = size === 'lg' ? 180 : 250;
    const newVal = Math.max(0, Math.min(1, dragRef.current.startVal + dy / sensitivity));
    onChange(newVal);
  }, [onChange, size]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    onChange(Math.max(0, Math.min(1, value + delta)));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newVal = value;
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') newVal = Math.min(1, value + step);
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') newVal = Math.max(0, value - step);
    if (newVal !== value) {
      e.preventDefault();
      onChange(newVal);
    }
  }, [value, onChange]);

  const angle = -135 + 270 * value;

  return (
    <div className="knob-container">
      <div className="knob-label">{label}</div>
      <div className={`knob-wrapper ${size}`}>
        <div
          className="knob"
          role="slider"
          aria-label={label}
          aria-valuenow={Math.round(value * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          style={{ '--knob-angle': `${angle}deg` } as CSSProperties}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
        >
          <div className="knob-pointer" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
        </div>
      </div>
      {endLabels && (
        <div className="knob-end-labels">
          <span>{endLabels[0]}</span>
          <span>{endLabels[1]}</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SELECTOR (DETENTED) COMPONENT
   ============================================================ */
function Selector({ label, detents, value, onChange, diagram }: {
  label: string;
  detents: string[];
  value: number;
  onChange: (v: number) => void;
  diagram?: React.ReactNode;
}) {
  const handleClick = () => {
    onChange((value + 1) % detents.length);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(detents.length - 1, value + 1));
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(0, value - 1));
    }
  };
  const normalizedValue = detents.length > 1 ? value / (detents.length - 1) : 0.5;
  const angle = -135 + 270 * normalizedValue;

  return (
    <div className="knob-container">
      <div className="knob-label">{label}</div>
      <div className="knob-wrapper lg">
        <div
          className="knob"
          role="radiogroup"
          aria-label={label}
          aria-valuetext={detents[value]}
          tabIndex={0}
          style={{ '--knob-angle': `${angle}deg` } as CSSProperties}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <div className="knob-pointer" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
        </div>
      </div>
      {diagram}
    </div>
  );
}

/* ============================================================
   LED COMPONENT
   ============================================================ */
function LED({ on, blink, small }: { on: boolean; blink?: boolean; small?: boolean }) {
  let cls = 'led';
  if (small) cls += ' sm';
  if (on) cls += ' on';
  if (blink && on) cls += ' blink';
  return <div className={cls} aria-hidden="true" />;
}

/* ============================================================
   BEIGE BUTTON
   ============================================================ */
function BeigeBtn({ children, onClick, latched, className }: {
  children: React.ReactNode;
  onClick?: () => void;
  latched?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`btn-beige ${className || ''} ${latched ? 'latched' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  // Continuous knob values (0..1)
  const [tuning, setTuning] = useState(0.5);
  const [cutOff, setCutOff] = useState(0.5);
  const [resonance, setResonance] = useState(0.3);
  const [envMod, setEnvMod] = useState(0.5);
  const [decay, setDecay] = useState(0.5);
  const [accentVal, setAccentVal] = useState(0.5);
  const [tempo, setTempo] = useState(0.5);
  const [volume, setVolume] = useState(0.7);

  // Detented selectors
  const [mode, setMode] = useState(0); // 0=TRACK, 1=PLAY, 2=WRITE
  const [trackGroup, setTrackGroup] = useState(0); // 0=TRACK, 1=I, 2=II, 3=III, 4=IV

  // Latching states
  const [runActive, setRunActive] = useState(false);
  const [pitchMode, setPitchMode] = useState(false);
  const [timeMode, setTimeMode] = useState(false);
  const [functionMode, setFunctionMode] = useState(0); // 0=BAR, 1=PATTERN

  // Keyboard & sequencer
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const [stepCursor, setStepCursor] = useState(0);

  // WebAudio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // BPM calculation: tempo 0..1 → 60..200 BPM
  const bpm = 60 + tempo * 140;
  const beatMs = 60000 / bpm;

  // Initialize WebAudio
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200 + cutOff * 4000;
      filter.Q.value = resonance * 20;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
      oscRef.current = osc;
      filterRef.current = filter;
      gainRef.current = gain;
    } catch (_e) { /* audio unavailable */ }
  }, [cutOff, resonance]);

  // Update filter params
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = 200 + cutOff * 4000;
      filterRef.current.Q.value = resonance * 20;
    }
  }, [cutOff, resonance]);

  // Update gain based on key presses + accent
  useEffect(() => {
    if (gainRef.current) {
      const accentBoost = 1 + accentVal * 0.5; // 1.0 to 1.5x
      const target = pressedKeys.size > 0 ? 0.2 * accentBoost : 0;
      gainRef.current.gain.linearRampToValueAtTime(target, (audioCtxRef.current?.currentTime || 0) + 0.02);
    }
  }, [pressedKeys, accentVal]);

  // Note frequencies (C3 to C4)
  const noteFreqs = [
    130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00,
    196.00, 207.65, 220.00, 233.08, 246.94, 261.63
  ];

  const handleKeyDown = (noteIndex: number) => {
    initAudio();
    setPressedKeys(prev => new Set(prev).add(noteIndex));
    if (oscRef.current) {
      oscRef.current.frequency.value = noteFreqs[noteIndex] || 110;
    }
  };

  const handleKeyUp = (noteIndex: number) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(noteIndex);
      return next;
    });
  };

  // WRITE/NEXT: advance step cursor
  const handleWriteNext = () => {
    initAudio();
    setStepCursor(prev => (prev + 1) % 16);
  };

  // Note names for header
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];
  // Black key positions (indices in whiteNotes array)
  const blackKeyIndices = [1, 3, 6, 8, 10];
  const blackKeyLabels = ['C#', 'D#', 'F#', 'G#', 'A#'];

  // Calculate left position for black keys as % of keybed width
  const getBlackKeyLeft = (i: number) => {
    // Each white key is ~7.69% width (100/13)
    // Black keys are centered between their adjacent white keys
    const whiteKeyWidth = 100 / 13;
    const positions = [
      whiteKeyWidth * 1 - whiteKeyWidth * 0.34,  // C#
      whiteKeyWidth * 3 - whiteKeyWidth * 0.34,  // D#
      whiteKeyWidth * 6 - whiteKeyWidth * 0.34,  // F#
      whiteKeyWidth * 8 - whiteKeyWidth * 0.34,  // G#
      whiteKeyWidth * 10 - whiteKeyWidth * 0.34, // A#
    ];
    return positions[i];
  };

  return (
    <div className="panel" style={{ '--beat': `${beatMs}ms` } as CSSProperties}>
      {/* ===== BAND A: Jack Silkscreen Strip ===== */}
      <header className="band-a">
        <div className="jack-group">
          <span className="jack-label">MIDI IN</span>
          <span className="jack-label">WAVEFORM</span>
          <span className="jack-label">SYNC IN</span>
        </div>
        <div className="jack-group">
          <span className="jack-label">CV</span>
          <span className="jack-label">GATE</span>
          <span className="jack-label">HEADPHONE</span>
          <span className="jack-label">OUTPUT</span>
          <span className="jack-label">DC IN</span>
        </div>
      </header>

      {/* ===== BAND B: Logo + Small Knobs ===== */}
      <section className="band-b">
        <svg className="logo-roland" viewBox="0 0 240 50" aria-label="Roland">
          <text x="10" y="40" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fontWeight="900" fontSize="40" fill="#141414" letterSpacing="2">Roland</text>
        </svg>
        <div className="knob-row-small">
          <Knob label="TUNING" value={tuning} onChange={setTuning} />
          <Knob label="CUT OFF FREQ" value={cutOff} onChange={setCutOff} />
          <Knob label="RESONANCE" value={resonance} onChange={setResonance} />
          <Knob label="ENV MOD" value={envMod} onChange={setEnvMod} />
          <Knob label="DECAY" value={decay} onChange={setDecay} />
          <Knob label="ACCENT" value={accentVal} onChange={setAccentVal} />
        </div>
        <span className="logo-bassline">Bass Line</span>
      </section>

      {/* ===== BAND C: Large Knobs ===== */}
      <section className="band-c">
        <div className="knob-row-large">
          {/* TEMPO */}
          <Knob label="TEMPO" value={tempo} onChange={setTempo} size="lg" endLabels={['SLOW', 'FAST']} />

          {/* TRACK / PATT. GROUP */}
          <Selector
            label="TRACK / PATT. GROUP"
            detents={['TRACK', 'I', 'II', 'III', 'IV']}
            value={trackGroup}
            onChange={setTrackGroup}
            diagram={
              <div className="selector-diagram">
                <div className="sd-row">
                  <div className={`sd-box ${trackGroup === 0 ? 'active' : ''}`}>TRACK</div>
                </div>
                <div className="sd-row">
                  <div className="sd-bracket" />
                  <div className={`sd-box ${trackGroup === 1 ? 'active' : ''}`}>I</div>
                  <div className={`sd-box ${trackGroup === 2 ? 'active' : ''}`}>II</div>
                  <div className={`sd-box ${trackGroup === 3 ? 'active' : ''}`}>III</div>
                  <div className={`sd-box ${trackGroup === 4 ? 'active' : ''}`}>IV</div>
                </div>
              </div>
            }
          />

          {/* MODE */}
          <Selector
            label="MODE"
            detents={['TRACK', 'PLAY', 'WRITE']}
            value={mode}
            onChange={setMode}
            diagram={
              <div className="selector-diagram">
                <div className="sd-row">
                  <div className="mode-diagram-box">WRITE</div>
                  <span style={{ fontSize: '0.45cqi' }}>/</span>
                  <div className="mode-diagram-box">PLAY</div>
                  <span style={{ fontSize: '0.4cqi' }}>→</span>
                  <div className={`mode-diagram-box ${mode === 0 ? 'active' : ''}`}>TRACK</div>
                </div>
                <div className="sd-row">
                  <div className="mode-diagram-box">PLAY</div>
                  <span style={{ fontSize: '0.4cqi' }}>→</span>
                  <div className={`mode-diagram-box ${mode === 1 ? 'active' : ''}`}>PATTERN</div>
                </div>
                <div className="sd-row">
                  <div className="mode-diagram-box">WRITE</div>
                  <span style={{ fontSize: '0.4cqi' }}>→</span>
                  <div className={`mode-diagram-box ${mode === 2 ? 'active' : ''}`}>PATTERN</div>
                </div>
              </div>
            }
          />

          {/* VOLUME */}
          <div className="knob-container">
            <Knob label="VOLUME" value={volume} onChange={setVolume} size="lg" endLabels={['OFF', 'ON']} />
            <div className="power-label">POWER SW</div>
          </div>
        </div>

        <div className="model-text">
          <span className="tb303">TB-303</span>
          <span className="cc">Computer Controlled</span>
        </div>
      </section>

      {/* ===== BAND D: Sequencer Deck ===== */}
      <section className="deck">
        {/* Column 1: Utility */}
        <div className="col col-util">
          <div className="util-box">
            <div className="util-label">D.C. / BAR RESET</div>
            <div className="util-label">PATTERN CLEAR</div>
            <BeigeBtn onClick={() => { setStepCursor(0); setPressedKeys(new Set()); }}>
              CLEAR
            </BeigeBtn>
          </div>
          <div className="util-box">
            <div className="util-label">RUN</div>
            <LED on={runActive} blink={runActive} />
            <div className="util-label">BATTERY</div>
            <BeigeBtn latched={runActive} onClick={() => setRunActive(!runActive)}>
              RUN/STOP
            </BeigeBtn>
          </div>
        </div>

        {/* Column 2: Mode */}
        <div className="col col-mode">
          <div className="mode-block-dark">
            <span className="wt">PITCH MODE</span>
            <LED on={pitchMode} />
            <BeigeBtn latched={pitchMode} onClick={() => setPitchMode(!pitchMode)}>
              PITCH
            </BeigeBtn>
          </div>
          <div className="mode-block-light">
            <span className="wt">FUNCTION</span>
            <LED on={functionMode > 0} />
            <BeigeBtn onClick={() => setFunctionMode((functionMode + 1) % 2)}>
              FUNC
            </BeigeBtn>
            <span style={{ fontSize: '0.55cqi', fontWeight: 600 }}>NORMAL MODE</span>
          </div>
          <div className="mode-chips-row">
            <div className={`mode-chip ${functionMode === 0 ? 'active' : ''}`}>BAR</div>
            <div className={`mode-chip orange ${functionMode === 1 ? 'active' : ''}`}>PATTERN</div>
          </div>
        </div>

        {/* Column 3: Keyboard */}
        <div className="col col-keys">
          {/* Note name header */}
          <div className="key-header">
            {noteNames.map((note, i) => (
              <span key={i}>{note}</span>
            ))}
          </div>

          {/* Keybed */}
          <div className="keybed">
            {/* White keys */}
            {noteNames.map((note, i) => (
              <button
                key={`w-${i}`}
                className={`key-white ${pressedKeys.has(i) ? 'pressed' : ''}`}
                onPointerDown={() => handleKeyDown(i)}
                onPointerUp={() => handleKeyUp(i)}
                onPointerLeave={() => handleKeyUp(i)}
                aria-label={`Key ${note}`}
                aria-pressed={pressedKeys.has(i)}
              >
                <div className={`key-led ${pressedKeys.has(i) || (runActive && i === stepCursor % 13) ? 'on' : ''}`} />
              </button>
            ))}

            {/* Black keys overlay */}
            <div className="black-keys-layer">
              {blackKeyLabels.map((note, i) => {
                const actualIndex = blackKeyIndices[i];
                return (
                  <button
                    key={`b-${i}`}
                    className={`key-black ${pressedKeys.has(actualIndex) ? 'pressed' : ''}`}
                    style={{ left: `${getBlackKeyLeft(i)}%` }}
                    onPointerDown={() => handleKeyDown(actualIndex)}
                    onPointerUp={() => handleKeyUp(actualIndex)}
                    onPointerLeave={() => handleKeyUp(actualIndex)}
                    aria-label={`Key ${note}`}
                    aria-pressed={pressedKeys.has(actualIndex)}
                  >
                    <div className={`key-led black-led ${pressedKeys.has(actualIndex) ? 'on' : ''}`} />
                    {i === 0 && <span className="bk-label">DEL</span>}
                    {i === 1 && <span className="bk-label">INS</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pattern footer */}
          <div className="key-footer">
            <span className="pat-label">PATTERN</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <span key={n} className="pat-num">{n}</span>
            ))}
          </div>

          {/* Selector chips */}
          <div className="selector-chips">
            {['1 DEL', '2 INS', '3', '4', '5', '6', '7', '8', '9', '0', '100', '200'].map((chip, i) => (
              <div key={i} className="sel-chip">{chip}</div>
            ))}
          </div>
        </div>

        {/* Column 4: Time Mode */}
        <div className="col col-time">
          <div className="time-header">
            <span>TIME MODE</span>
            <LED on={timeMode} small />
          </div>
          <div className="time-music-icons">
            <span>♩</span><span>♪</span><span>♫</span>
          </div>
          <BeigeBtn latched={timeMode} onClick={() => setTimeMode(!timeMode)}>
            TIME
          </BeigeBtn>

          <div className="time-func-row">
            <div className="time-func-chip">TRANSPOSE DOWN</div>
            <div className="time-btn-group">
              <LED on={false} small />
              <BeigeBtn>▼</BeigeBtn>
              <span className="time-caption">STEP</span>
            </div>
          </div>

          <div className="time-func-row">
            <div className="time-func-chip">UP</div>
            <div className="time-btn-group">
              <LED on={false} small />
              <BeigeBtn>▲</BeigeBtn>
              <span className="time-caption">⌇</span>
            </div>
          </div>

          <div className="time-func-row">
            <div className="time-func-chip">ACCENT</div>
            <div className="time-btn-group">
              <LED on={false} small />
              <BeigeBtn>ACC</BeigeBtn>
            </div>
          </div>

          <div className="time-func-row">
            <div className="time-func-chip">SLIDE</div>
            <div className="time-btn-group">
              <LED on={false} small />
              <BeigeBtn>SLD</BeigeBtn>
              <span className="time-caption orange">PATT. SECTION</span>
            </div>
          </div>
        </div>

        {/* Column 5: Edge */}
        <div className="col col-edge">
          <div className="edge-box">
            <span className="back-glyph">←</span>
            <div className="edge-label">BACK</div>
            <BeigeBtn onClick={() => setStepCursor(prev => Math.max(0, prev - 1))}>
              ←
            </BeigeBtn>
          </div>
          <div className="edge-box">
            <div className="ds-chip">D.S.</div>
            <BeigeBtn onClick={handleWriteNext}>
              WRITE/NEXT
            </BeigeBtn>
            <div className="edge-label">WRITE/NEXT</div>
            <div className="edge-label">TAP</div>
          </div>
        </div>
      </section>
    </div>
  );
}
