"""
VoxFable Studio-Grade Audio Asset Generator
Synthesizes rich, harmonic, acoustic bedtime storybook music loops & crisp sound effects.
Renders to WAV then converts to 128kbps MP3 via FFmpeg.
"""

import os
import shutil
import math
import struct
import wave
import subprocess
from pathlib import Path
import numpy as np

SAMPLE_RATE = 44100

def get_ffmpeg_cmd():
    cmd = shutil.which("ffmpeg")
    if not cmd:
        local_app = os.environ.get("LOCALAPPDATA")
        if local_app:
            for p in Path(local_app).glob("Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/ffmpeg.exe"):
                cmd = str(p)
                break
    return cmd or "ffmpeg"

def write_wav(path: Path, data: np.ndarray, sample_rate: int = SAMPLE_RATE):
    # Ensure float32 clamped between -1.0 and 1.0
    data = np.clip(data, -0.98, 0.98)
    if data.ndim == 1:
        # Mono to stereo
        stereo = np.column_stack((data, data))
    else:
        stereo = data
    
    int_data = (stereo * 32767.0).astype(np.int16)
    with wave.open(str(path), 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(int_data.tobytes())

def wav_to_mp3(wav_path: Path, mp3_path: Path):
    ffmpeg = get_ffmpeg_cmd()
    cmd = [
        ffmpeg, "-y", "-i", str(wav_path),
        "-codec:a", "libmp3lame", "-b:a", "128k",
        str(mp3_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if wav_path.exists():
        wav_path.unlink()

# --- Acoustic Instrument Synthesis Primitives ---

def note_freq(midi_note: float) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))

def synth_piano_note(freq: float, duration: float, velocity: float = 0.8) -> np.ndarray:
    """Warm acoustic piano / celeste note with realistic harmonics and ADSR."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Harmonics: fundamental, octave, octave+fifth, 2 octaves
    h1 = np.sin(2 * np.pi * freq * t) * 1.0
    h2 = np.sin(2 * np.pi * freq * 2.0 * t) * 0.4 * np.exp(-t * 2.0)
    h3 = np.sin(2 * np.pi * freq * 3.0 * t) * 0.2 * np.exp(-t * 3.5)
    h4 = np.sin(2 * np.pi * freq * 4.0 * t) * 0.1 * np.exp(-t * 5.0)
    
    # Touch of wooden strike transient
    strike = np.random.uniform(-0.1, 0.1, len(t)) * np.exp(-t * 60.0)
    
    # Exponential decay envelope
    envelope = np.exp(-t * 1.8) * (1.0 - np.exp(-t * 80.0))
    signal = (h1 + h2 + h3 + h4 + strike) * envelope * velocity
    return signal

def synth_marimba_note(freq: float, duration: float, velocity: float = 0.8) -> np.ndarray:
    """Warm wooden marimba mallet tone."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Characteristic marimba 4th overtone (3.9x fundamental)
    fund = np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.5)
    overtone = np.sin(2 * np.pi * freq * 3.9 * t) * 0.3 * np.exp(-t * 12.0)
    click = np.random.uniform(-0.15, 0.15, len(t)) * np.exp(-t * 120.0)
    
    env = (1.0 - np.exp(-t * 200.0))
    return (fund + overtone + click) * env * velocity

def apply_reverb_stereo(signal: np.ndarray, delay_ms: float = 35.0, decay: float = 0.35) -> np.ndarray:
    """Adds lush spatial depth and stereo warmth."""
    delay_samples = int((delay_ms / 1000.0) * SAMPLE_RATE)
    left = np.copy(signal)
    right = np.copy(signal)
    
    # Cross-feedback delay
    if len(left) > delay_samples:
        right[delay_samples:] += left[:-delay_samples] * decay
        left[delay_samples * 2:] += right[delay_samples:-delay_samples] * (decay * 0.5)
    
    return np.column_stack((left, right))

# --- Music Loop Composers ---

def generate_music_calm(duration: float = 16.0) -> np.ndarray:
    """
    Gentle Bedtime Lullaby (C - G - Am - F)
    Warm piano, celesta arpeggios, and soft ambient bass.
    """
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    
    # Chords (MIDI notes)
    # C major (60, 64, 67), G major (55, 59, 62), A minor (57, 60, 64), F major (53, 57, 60)
    progression = [
        [48, 60, 64, 67, 72], # C
        [43, 55, 59, 62, 71], # G
        [45, 57, 60, 64, 69], # Am
        [41, 53, 57, 60, 65], # F
    ]
    
    chord_len = duration / len(progression) # 4 seconds each
    for c_idx, chord in enumerate(progression):
        start_time = c_idx * chord_len
        # Bass note (warm long decay)
        bass_freq = note_freq(chord[0])
        b_sig = synth_piano_note(bass_freq, chord_len, velocity=0.6)
        start_sample = int(start_time * SAMPLE_RATE)
        end_sample = min(total_samples, start_sample + len(b_sig))
        mix[start_sample:end_sample] += b_sig[:end_sample - start_sample] * 0.7
        
        # Gentle arpeggio across the chord
        arp_notes = chord[1:]
        step = chord_len / (len(arp_notes) * 2)
        for i in range(len(arp_notes) * 2):
            note = arp_notes[i % len(arp_notes)] + (12 if i >= len(arp_notes) else 0)
            note_start = start_time + (i * step)
            note_sig = synth_piano_note(note_freq(note), 2.5, velocity=0.45)
            s_idx = int(note_start * SAMPLE_RATE)
            e_idx = min(total_samples, s_idx + len(note_sig))
            if s_idx < total_samples:
                mix[s_idx:e_idx] += note_sig[:e_idx - s_idx] * 0.5
                
    return apply_reverb_stereo(mix, delay_ms=45.0, decay=0.4)

def generate_music_cheerful(duration: float = 12.0) -> np.ndarray:
    """
    Playful, bouncing storybook melody with marimba and warm acoustic tones.
    """
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    
    # Melody notes (G Major pentatonic: G4, A4, B4, D5, E5, G5)
    # MIDI: 67, 69, 71, 74, 76, 79
    melody = [
        (67, 0.0), (71, 0.4), (74, 0.8), (76, 1.2), (74, 1.6), (71, 2.0), (67, 2.4),
        (69, 3.0), (71, 3.4), (74, 3.8), (71, 4.4), (69, 5.0),
        (67, 6.0), (71, 6.4), (74, 6.8), (79, 7.2), (76, 7.6), (74, 8.0), (71, 8.4),
        (74, 9.0), (71, 9.6), (69, 10.2), (67, 10.8)
    ]
    
    # Bass backing
    bass_chords = [
        (55, 0.0), (55, 1.5), (57, 3.0), (57, 4.5),
        (55, 6.0), (55, 7.5), (50, 9.0), (55, 10.5)
    ]
    
    for note, t_sec in bass_chords:
        b_sig = synth_marimba_note(note_freq(note), 1.2, velocity=0.5)
        s_idx = int(t_sec * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(b_sig))
        if s_idx < total_samples:
            mix[s_idx:e_idx] += b_sig[:e_idx - s_idx] * 0.6
            
    for note, t_sec in melody:
        m_sig = synth_marimba_note(note_freq(note), 0.9, velocity=0.7)
        s_idx = int(t_sec * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(m_sig))
        if s_idx < total_samples:
            mix[s_idx:e_idx] += m_sig[:e_idx - s_idx] * 0.75
            
    return apply_reverb_stereo(mix, delay_ms=30.0, decay=0.3)

def generate_music_adventure(duration: float = 14.0) -> np.ndarray:
    """
    Inspiring, wonder-filled storybook progression with rich strings & piano.
    """
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    
    # Progression: D maj -> B min -> G maj -> A maj
    chords = [
        [50, 62, 66, 69, 74], # D
        [47, 59, 62, 66, 71], # Bm
        [43, 55, 59, 62, 67], # G
        [45, 57, 61, 64, 69]  # A
    ]
    
    chord_len = duration / len(chords)
    for c_idx, chord in enumerate(chords):
        c_time = c_idx * chord_len
        # Orchestral piano pulse
        for beat in range(4):
            b_time = c_time + (beat * (chord_len / 4.0))
            for n_idx, n in enumerate(chord):
                p_sig = synth_piano_note(note_freq(n), 1.5, velocity=0.4 if n_idx > 0 else 0.65)
                s_idx = int(b_time * SAMPLE_RATE)
                e_idx = min(total_samples, s_idx + len(p_sig))
                if s_idx < total_samples:
                    mix[s_idx:e_idx] += p_sig[:e_idx - s_idx] * 0.35
                    
    return apply_reverb_stereo(mix, delay_ms=40.0, decay=0.45)

def generate_music_mystery_soft(duration: float = 12.0) -> np.ndarray:
    """
    Music box / celestial fairy-tale ambiance.
    """
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    
    # High twinkling pentatonic notes
    twinkles = [
        (72, 0.0), (76, 0.6), (79, 1.2), (84, 1.8), (81, 2.4), (79, 3.2),
        (74, 4.0), (77, 4.6), (81, 5.2), (86, 5.8), (84, 6.4), (81, 7.2),
        (72, 8.0), (76, 8.6), (79, 9.2), (84, 9.8), (88, 10.4), (84, 11.0)
    ]
    
    for note, t_sec in twinkles:
        t_sig = synth_piano_note(note_freq(note), 2.0, velocity=0.6)
        s_idx = int(t_sec * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(t_sig))
        if s_idx < total_samples:
            mix[s_idx:e_idx] += t_sig[:e_idx - s_idx] * 0.6
            
    return apply_reverb_stereo(mix, delay_ms=50.0, decay=0.5)

# --- Sound Effect (SFX) Synthesizers ---

def generate_sfx_sparkle(duration: float = 1.4) -> np.ndarray:
    """Shimmering ascending fairy dust chime."""
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    notes = [76, 79, 81, 84, 88, 91, 93, 96] # High pentatonic sparkle
    for idx, n in enumerate(notes):
        t_start = idx * 0.09
        sig = synth_piano_note(note_freq(n), 0.8, velocity=0.7)
        s_idx = int(t_start * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(sig))
        mix[s_idx:e_idx] += sig[:e_idx - s_idx] * 0.7
    return apply_reverb_stereo(mix, delay_ms=25.0, decay=0.45)

def generate_sfx_pop(duration: float = 0.3) -> np.ndarray:
    """Crisp, punchy cartoon bubble pop."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Frequency sweep downwards 900Hz -> 200Hz
    freq = 900.0 * np.exp(-t * 28.0) + 180.0
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    signal = np.sin(phase) * np.exp(-t * 35.0) * 0.9
    return np.column_stack((signal, signal))

def generate_sfx_ding(duration: float = 1.2) -> np.ndarray:
    """Pure resonant bell chime."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    h1 = np.sin(2 * np.pi * 1760.0 * t) * np.exp(-t * 4.0)
    h2 = np.sin(2 * np.pi * 3520.0 * t) * 0.3 * np.exp(-t * 8.0)
    sig = (h1 + h2) * 0.85
    return apply_reverb_stereo(sig, delay_ms=20.0, decay=0.35)

def generate_sfx_whoosh(duration: float = 0.8) -> np.ndarray:
    """Smooth cinematic air whoosh."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, len(t))
    # Smooth bell envelope
    env = np.sin(np.pi * t / duration) ** 2
    # Lowpass filter frequency sweep
    cutoff = 400.0 + 1800.0 * np.sin(np.pi * t / duration)
    phase = 2 * np.pi * np.cumsum(cutoff) / SAMPLE_RATE
    sig = noise * np.sin(phase) * env * 0.65
    return apply_reverb_stereo(sig, delay_ms=35.0, decay=0.3)

def generate_sfx_footsteps(duration: float = 1.2) -> np.ndarray:
    """Gentle woodland footsteps (soft double-tap)."""
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    for step_time in [0.0, 0.45, 0.85]:
        t = np.linspace(0, 0.2, int(SAMPLE_RATE * 0.2), endpoint=False)
        f = 140.0 * np.exp(-t * 30.0) + 60.0
        phase = 2 * np.pi * np.cumsum(f) / SAMPLE_RATE
        thump = np.sin(phase) * np.exp(-t * 25.0) * 0.6
        s_idx = int(step_time * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(thump))
        mix[s_idx:e_idx] += thump[:e_idx - s_idx]
    return np.column_stack((mix, mix))

def generate_sfx_gasp(duration: float = 0.6) -> np.ndarray:
    """Cute breathy cartoon gasp."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = 300.0 + 350.0 * (t / duration) ** 1.5
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    noise = np.random.uniform(-0.2, 0.2, len(t))
    env = np.sin(np.pi * t / duration) * np.exp(-t * 2.0)
    sig = (np.sin(phase) * 0.5 + noise) * env * 0.7
    return np.column_stack((sig, sig))

def generate_sfx_giggle(duration: float = 1.0) -> np.ndarray:
    """Cheerful, cute cartoon giggle tones."""
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    chuckles = [0.0, 0.18, 0.35, 0.52, 0.7]
    for idx, c_time in enumerate(chuckles):
        freq = 520.0 + (idx % 2) * 110.0
        note = synth_marimba_note(freq, 0.16, velocity=0.7)
        s_idx = int(c_time * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(note))
        mix[s_idx:e_idx] += note[:e_idx - s_idx]
    return apply_reverb_stereo(mix, delay_ms=20.0, decay=0.3)

def generate_sfx_birds(duration: float = 2.5) -> np.ndarray:
    """Gentle morning forest songbirds."""
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    chirps = [(0.2, 2800.0), (0.4, 3200.0), (0.6, 2900.0), (1.4, 3400.0), (1.6, 3100.0), (1.8, 3600.0)]
    for start, f_base in chirps:
        t = np.linspace(0, 0.12, int(SAMPLE_RATE * 0.12), endpoint=False)
        freq = f_base + 600.0 * np.sin(2 * np.pi * 25.0 * t)
        phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
        chirp = np.sin(phase) * np.sin(np.pi * t / 0.12) * 0.5
        s_idx = int(start * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(chirp))
        mix[s_idx:e_idx] += chirp[:e_idx - s_idx]
    return apply_reverb_stereo(mix, delay_ms=40.0, decay=0.4)

def generate_sfx_wind(duration: float = 2.0) -> np.ndarray:
    """Soft woodland breeze."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, len(t))
    # Low pass filtered sweeping noise
    env = np.sin(np.pi * t / duration) ** 2
    f = 250.0 + 200.0 * np.sin(2 * np.pi * 0.8 * t)
    phase = 2 * np.pi * np.cumsum(f) / SAMPLE_RATE
    sig = noise * np.sin(phase) * env * 0.5
    return apply_reverb_stereo(sig, delay_ms=50.0, decay=0.4)

def generate_sfx_door(duration: float = 1.0) -> np.ndarray:
    """Warm rustic wooden door opening with latch."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Latch click + resonant groan
    click = np.sin(2 * np.pi * 1200.0 * t) * np.exp(-t * 90.0)
    groan_f = 110.0 + 40.0 * np.sin(2 * np.pi * 6.0 * t)
    phase = 2 * np.pi * np.cumsum(groan_f) / SAMPLE_RATE
    groan = np.sin(phase) * np.exp(-t * 3.5) * 0.6
    sig = (click * 0.8 + groan) * 0.75
    return np.column_stack((sig, sig))

def generate_sfx_splash(duration: float = 0.8) -> np.ndarray:
    """Liquid cartoon water splash."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, len(t))
    f = 800.0 * np.exp(-t * 8.0) + 200.0
    phase = 2 * np.pi * np.cumsum(f) / SAMPLE_RATE
    sig = (noise * 0.4 + np.sin(phase) * 0.6) * np.exp(-t * 6.0) * 0.7
    return apply_reverb_stereo(sig, delay_ms=25.0, decay=0.3)

def generate_sfx_fanfare(duration: float = 2.0) -> np.ndarray:
    """Uplifting celebration trumpet fanfare chord."""
    total_samples = int(SAMPLE_RATE * duration)
    mix = np.zeros(total_samples, dtype=np.float32)
    # C major triad fanfare: C5 (72), E5 (76), G5 (79), C6 (84)
    notes = [(72, 0.0), (76, 0.25), (79, 0.5), (84, 0.75)]
    for n, t_start in notes:
        freq = note_freq(n)
        t = np.linspace(0, 1.2, int(SAMPLE_RATE * 1.2), endpoint=False)
        # Bright brassy harmonics
        h1 = np.sin(2 * np.pi * freq * t) * 0.8
        h2 = np.sin(2 * np.pi * freq * 2 * t) * 0.4
        h3 = np.sin(2 * np.pi * freq * 3 * t) * 0.2
        sig = (h1 + h2 + h3) * np.exp(-t * 2.2) * (1.0 - np.exp(-t * 40.0))
        s_idx = int(t_start * SAMPLE_RATE)
        e_idx = min(total_samples, s_idx + len(sig))
        mix[s_idx:e_idx] += sig[:e_idx - s_idx] * 0.6
    return apply_reverb_stereo(mix, delay_ms=30.0, decay=0.4)

def main():
    root = Path(__file__).resolve().parent.parent
    frontend_music_dir = root / "frontend" / "public" / "assets" / "audio" / "music"
    frontend_sfx_dir = root / "frontend" / "public" / "assets" / "audio" / "sfx"
    demo_audio_dir = root / "frontend" / "public" / "demo" / "audio"
    
    frontend_music_dir.mkdir(parents=True, exist_ok=True)
    frontend_sfx_dir.mkdir(parents=True, exist_ok=True)
    demo_audio_dir.mkdir(parents=True, exist_ok=True)
    
    tmp_dir = root / "media" / "tmp_audio"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    
    music_generators = {
        "calm": generate_music_calm,
        "cheerful": generate_music_cheerful,
        "adventure": generate_music_adventure,
        "mystery_soft": generate_music_mystery_soft,
    }
    
    sfx_generators = {
        "sparkle": generate_sfx_sparkle,
        "pop": generate_sfx_pop,
        "ding": generate_sfx_ding,
        "whoosh": generate_sfx_whoosh,
        "footsteps": generate_sfx_footsteps,
        "gasp": generate_sfx_gasp,
        "giggle": generate_sfx_giggle,
        "birds": generate_sfx_birds,
        "wind": generate_sfx_wind,
        "door": generate_sfx_door,
        "splash": generate_sfx_splash,
        "fanfare": generate_sfx_fanfare,
    }
    
    print("Synthesizing rich, acoustic music loops...")
    for name, gen_fn in music_generators.items():
        wav_file = tmp_dir / f"{name}.wav"
        data = gen_fn()
        write_wav(wav_file, data)
        
        # Primary MP3 file in music/
        dest_mp3 = frontend_music_dir / f"{name}.mp3"
        wav_to_mp3(wav_file, dest_mp3)
        print(f"  ✓ Created {dest_mp3.name} ({dest_mp3.stat().st_size} bytes)")
        
        # Replicate aliases (music_<name>.mp3 and demo/audio/<name>.mp3)
        alias_mp3 = frontend_music_dir / f"music_{name}.mp3"
        shutil.copy2(dest_mp3, alias_mp3)
        shutil.copy2(dest_mp3, demo_audio_dir / f"{name}.mp3")
        shutil.copy2(dest_mp3, demo_audio_dir / f"music_{name}.mp3")

    print("\nSynthesizing crisp storybook sound effects...")
    for name, gen_fn in sfx_generators.items():
        wav_file = tmp_dir / f"{name}.wav"
        data = gen_fn()
        write_wav(wav_file, data)
        
        dest_mp3 = frontend_sfx_dir / f"{name}.mp3"
        wav_to_mp3(wav_file, dest_mp3)
        print(f"  ✓ Created {dest_mp3.name} ({dest_mp3.stat().st_size} bytes)")
        
        alias_mp3 = frontend_sfx_dir / f"sfx_{name}.mp3"
        shutil.copy2(dest_mp3, alias_mp3)
        shutil.copy2(dest_mp3, demo_audio_dir / f"{name}.mp3")
        shutil.copy2(dest_mp3, demo_audio_dir / f"sfx_{name}.mp3")
        
    # Clean tmp
    shutil.rmtree(tmp_dir, ignore_errors=True)
    print("\n[SUCCESS] All music loops and sound effects upgraded to studio-grade quality!")

if __name__ == "__main__":
    main()
