import React from 'react';

interface HeroProps {
  onOrderClick: () => void;
  title?: string;
  subtitle?: string;
  image?: string;
}

const Hero: React.FC<HeroProps> = ({ onOrderClick, title, subtitle, image }) => {
  return (
    <div className="relative h-[600px] w-full overflow-hidden flex items-center justify-center bg-gray-900">
      {/* Background Image - Curry */}
      <div className="absolute inset-0 z-0">
        <img
          src={image || "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1920&auto=format&fit=crop"}
          alt="Authentic Curry"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-black/40"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-10">
        <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 leading-tight drop-shadow-lg">
          {title || "Karuwa Takeaway"}
        </h1>
        <p className="text-gray-200 text-lg md:text-xl mb-8 font-light tracking-wide drop-shadow-md">
          {subtitle || "Authentic Nepalese & Indian flavours. Spicy. Fresh. Local."}
        </p>
        <button
          onClick={onOrderClick}
          className="bg-karuwa-brandOrange text-white hover:bg-white hover:text-karuwa-brandOrange transition-all duration-300 px-10 py-3 rounded-full font-bold text-sm uppercase tracking-widest shadow-lg transform hover:-translate-y-1"
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default Hero;