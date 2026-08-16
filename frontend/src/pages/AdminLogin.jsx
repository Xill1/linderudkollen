import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, WifiOff, ServerCrash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      if (err.message === 'NETWORK_ERROR') {
        setError({
          type: 'network',
          icon: <WifiOff className="w-4 h-4" />,
          title: 'Kunne ikke koble til serveren',
          body: 'Sjekk internettforbindelsen din, eller prøv igjen om litt.',
        });
      } else if (err.message === 'WRONG_CREDENTIALS') {
        setError({
          type: 'credentials',
          icon: <AlertCircle className="w-4 h-4" />,
          title: 'Feil brukernavn eller passord',
          body: 'Sjekk at du har skrevet riktig og prøv igjen.',
        });
      } else {
        setError({
          type: 'server',
          icon: <ServerCrash className="w-4 h-4" />,
          title: 'Noe gikk galt',
          body: 'En uventet feil oppstod. Kontakt Liam for hjelp.',
          contact: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-none" data-testid="admin-login-card">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Linderudkollen Sportsstue"
            className="h-24 w-auto mx-auto mb-5"
          />
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Admin
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Logg inn for å administrere nettsiden</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brukernavn</label>
            <input
              data-testid="admin-username-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Brukernavn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passord</label>
            <input
              data-testid="admin-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Passord"
            />
          </div>
          {error && (
            <div
              data-testid="admin-login-error"
              className={`rounded-xl px-4 py-3.5 text-sm border ${
                error.type === 'credentials'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : error.type === 'network'
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-0.5">
                {error.icon}
                {error.title}
              </div>
              <p className="text-xs opacity-80 ml-6">{error.body}</p>
              {error.contact && (
                <p className="mt-1 ml-6 text-xs opacity-70">Kontakt Liam for hjelp.</p>
              )}
            </div>
          )}
          <Button
            type="submit"
            data-testid="admin-login-btn"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 text-lg font-semibold"
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <a href="/" className="text-amber-700 hover:text-amber-800 text-sm font-medium">
            Tilbake til nettsiden
          </a>
        </div>
      </Card>
    </div>
  );
}
