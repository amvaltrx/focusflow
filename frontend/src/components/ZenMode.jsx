import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Maximize } from 'lucide-react';
import './ZenMode.css';

const ZenMode = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="zen-mode-overlay animate-fade-in">
            {/* Embedded lo-fi audio player (hidden iframe) */}
            <iframe 
                width="0" height="0" 
                src={`https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=${isMuted ? 0 : 1}&controls=0`} 
                title="Lofi" 
                frameBorder="0" 
                allow="autoplay" 
                style={{ display: 'none' }}
            ></iframe>
            
            <div className="zen-controls-top">
                <button className="zen-btn" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <button className="zen-btn text-danger" onClick={onClose}>
                    <Maximize size={24} /> Exit Zen Mode
                </button>
            </div>

            <div className="zen-content">
                <h1 className="zen-time">{formatTime(timeLeft)}</h1>
                <div className="zen-actions">
                    <button className="zen-play-btn" onClick={() => setIsRunning(!isRunning)}>
                        {isRunning ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                    </button>
                    <button className="zen-stop-btn" onClick={() => { setIsRunning(false); setTimeLeft(25*60); }}>
                        <Square size={24} />
                    </button>
                </div>
            </div>
            
            <div className="zen-quote">
                "Flow is being completely involved in an activity for its own sake. The ego falls away. Time flies."
            </div>
        </div>
    );
};

export default ZenMode;
