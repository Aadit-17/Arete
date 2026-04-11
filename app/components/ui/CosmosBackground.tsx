/**
 * Full-viewport galaxy photo with a dark scrim so UI text stays readable.
 * (Planetary / starfield layers removed — image is the only backdrop.)
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
                style={{ backgroundImage: 'url(/galaxy-bg.jpg)' }}
            />
            {/* Stronger multi-stop scrim: keeps type clear without hiding the galaxy */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/82 via-[#020202]/68 to-[#020202]/88" />
            <div className="absolute inset-0 bg-[#020202]/35" />
            {/* Subtle grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        </div>
    );
};
