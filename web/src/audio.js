// Synthesized gameplay audio keeps the offline build free of external media.
export function makeAudio() {
  let ctx, master, noise, engine, engineLevel, rainLevel;
  let available = true;
  let muted = false;

  function unlock() {
    if (!available) return;
    try {
      if (!ctx) {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : .48;
        master.connect(ctx.destination);
        noise = ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i=0; i<samples.length; i++) samples[i]=Math.random()*2-1;

        engine=ctx.createOscillator();
        engine.type='triangle';engine.frequency.value=44;
        const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=190;
        engineLevel=ctx.createGain();engineLevel.gain.value=0;
        engine.connect(filter).connect(engineLevel).connect(master);engine.start();

        rainLevel=ctx.createGain();rainLevel.gain.value=0;
        const rain=ctx.createBufferSource();rain.buffer=noise;rain.loop=true;
        const rainFilter=ctx.createBiquadFilter();rainFilter.type='bandpass';rainFilter.frequency.value=1320;rainFilter.Q.value=.46;
        rain.connect(rainFilter).connect(rainLevel).connect(master);rain.start();
      }
      if (ctx.state==='suspended') ctx.resume().catch(()=>{});
    } catch { available=false; }
  }

  function tone(from,to,length,volume,type='triangle',delay=0) {
    const source=ctx.createOscillator(), gain=ctx.createGain(), start=ctx.currentTime+delay;
    source.type=type; source.frequency.setValueAtTime(from,start);
    source.frequency.exponentialRampToValueAtTime(to,start+length);
    gain.gain.setValueAtTime(Math.max(.001,volume),start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    source.connect(gain).connect(master); source.start(start); source.stop(start+length+.015);
  }

  function burst(frequency,length,volume,filterType='lowpass') {
    const source=ctx.createBufferSource(), gain=ctx.createGain(), filter=ctx.createBiquadFilter();
    const now=ctx.currentTime;
    source.buffer=noise;
    filter.type=filterType; filter.frequency.value=frequency;
    gain.gain.setValueAtTime(volume,now); gain.gain.exponentialRampToValueAtTime(.0001,now+length);
    source.connect(filter).connect(gain).connect(master);
    source.start(now,Math.random()*.25);source.stop(now+length);
  }

  function play(name) {
    if (!available || !ctx || ctx.state!=='running' || muted) return;
    switch(name) {
      case 'footstep': burst(670,.082,.12);tone(85,51,.073,.035);break;
      case 'land': burst(490,.16,.26);tone(90,42,.12,.12);break;
      case 'door': burst(920,.12,.21);tone(120,70,.10,.15);break;
      case 'pulse': burst(2000,.13,.33,'bandpass');tone(670,95,.18,.26,'sawtooth');break;
      case 'hit': tone(680,400,.12,.14,'sine');break;
      case 'reload': burst(2100,.1,.22,'bandpass');tone(360,530,.19,.10,'square',.08);break;
      case 'boost': burst(2100,.44,.38,'bandpass');tone(74,160,.46,.24,'sawtooth');break;
      case 'boostEnd': burst(1800,.2,.23,'highpass');break;
      case 'transform': burst(1650,.31,.22,'bandpass');tone(170,590,.29,.21);break;
      case 'water': burst(710,.33,.22);tone(134,62,.33,.13,'sine');break;
      case 'scan': tone(680,990,.18,.14,'sine');tone(830,1200,.28,.12,'sine',.07);break;
      case 'reward': [392,494,587,784].forEach((n,i)=>tone(n,n*1.012,.32,.15,'triangle',i*.09));break;
      case 'checkpoint': tone(430,620,.22,.13);tone(620,750,.18,.09,'sine',.11);break;
      case 'alarm': [0,.27,.54].forEach(delay=>tone(325,680,.23,.16,'triangle',delay));break;
      case 'dry': tone(85,68,.10,.13,'square');break;
      default: tone(370,480,.14,.07);
    }
  }

  function update({running,speed,mode,boosting,wet,active}) {
    if (!available || !ctx) return;
    const now=ctx.currentTime;
    engine.frequency.setTargetAtTime((mode==='dive'?34:45)+Math.abs(speed)*1.6+(boosting?53:0),now,.09);
    engineLevel.gain.setTargetAtTime(active&&running?.085+Math.min(.12,Math.abs(speed)*.003)+(boosting?.06:0):0,now,.19);
    rainLevel.gain.setTargetAtTime(active?wet*.075:0,now,.25);
  }

  return {unlock,play,update,toggle() {
    muted=!muted;
    if (ctx) master.gain.setTargetAtTime(muted?0:.48,ctx.currentTime,.03);
    return muted;
  }};
}
