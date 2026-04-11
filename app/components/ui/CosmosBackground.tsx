/**
 * Full-viewport background from the Aether glass reference (stitch) + scrim for readable type.
 */
export const CosmosBackground = () => {
    return (
        <div
            className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020202]"
            aria-hidden
        >
            {/* Photo layer — sharp enough to read; scrim does the contrast work */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: 'url(/aether-dashboard-bg.png)' }}
            />
            {/* Minimal scrim — just enough for text contrast. Cards blur what they cover. */}
            <div className="absolute inset-0 bg-[#020202]/55" />
            {/* Subtle grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        </div>
    );
};
