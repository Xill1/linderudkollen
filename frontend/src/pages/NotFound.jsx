import { useNavigate } from 'react-router-dom';
import { TreePine, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <TreePine className="w-10 h-10 text-amber-700" />
          </div>
        </div>

        {/* 404 number */}
        <p
          className="text-8xl font-bold text-amber-200 mb-0 leading-none select-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          404
        </p>

        <h1
          className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Siden finnes ikke
        </h1>

        <p className="text-gray-500 mb-8 leading-relaxed">
          Det ser ut til at du har vandret litt for langt inn i skogen.
          La oss finne veien tilbake.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Gå tilbake
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors shadow-md shadow-amber-200/60"
          >
            <Home className="w-4 h-4" />
            Til forsiden
          </button>
        </div>
      </div>
    </div>
  );
}
