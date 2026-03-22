import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Target, DollarSign, BookOpen, Download, Trash2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function BusinessPlanner() {
  const [domain, setDomain] = useState('');
  const [budget, setBudget] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ id: number; domain: string; budget: string; plan: string; date: string }[]>([]);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('businessPlansHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('businessPlansHistory', JSON.stringify(history));
  }, [history]);

  const generatePlan = async () => {
    if (!domain || !budget) return;
    setLoading(true);
    setPlan('');

    try {
      const prompt = `Vous êtes un expert en stratégie d'entreprise. L'utilisateur souhaite lancer une entreprise dans le domaine "${domain}" avec un budget de ${budget} FCFA. Générez une feuille de route complète et étape par étape couvrant : 1. Configuration initiale, 2. Marketing/Acquisition, 3. Stratégies de mise à l'échelle, 4. Pièges potentiels. 5. Une section finale avec des estimations financières (chiffre d'affaires estimé, commissions, rentabilité) basées sur le budget fourni. POUR CHAQUE ÉTAPE, FOURNISSEZ DES EXEMPLES CONCRETS ET PRATIQUES ADAPTÉS AU DOMAINE "${domain}" ET AU BUDGET DE ${budget} FCFA. Soyez concret et pratique. Utilisez le format markdown en français.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const newPlan = response.text || 'Aucun plan généré.';
      setPlan(newPlan);
      setHistory(prev => [{ id: Date.now(), domain, budget, plan: newPlan, date: new Date().toLocaleString() }, ...prev]);
    } catch (error) {
      console.error('Erreur lors de la génération du plan:', error);
      setPlan('Une erreur est survenue lors de la génération de votre plan. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const consultPlan = (id: number) => {
    const planItem = history.find(item => item.id === id);
    if (planItem) {
      setDomain(planItem.domain);
      setBudget(planItem.budget);
      setPlan(planItem.plan);
    }
  };

  const deletePlan = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (plan && history.find(item => item.id === id)?.plan === plan) {
      setPlan('');
    }
  };

  const exportToPDF = () => {
    if (planRef.current) {
      const opt = {
        margin: 1,
        filename: 'plan_affaires.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(planRef.current).save();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Générateur de Plan d'Affaires</h1>
          <p className="text-neutral-600 mt-2">Transformez votre domaine et votre budget en une stratégie concrète.</p>
        </header>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Domaine d'activité</label>
              <div className="relative">
                <Target className="absolute left-3 top-3 text-neutral-400" size={18} />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="ex: E-commerce, SaaS, Conseil"
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Budget (en FCFA)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-neutral-400" size={18} />
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="ex: 500 000"
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
          <button
            onClick={generatePlan}
            disabled={loading || !domain || !budget}
            className="mt-6 w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}
            {loading ? 'Génération de la stratégie...' : 'Générer la feuille de route'}
          </button>
        </div>

        {plan && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 mb-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Download size={20} />
                Exporter en PDF
              </button>
            </div>
            <div ref={planRef} className="prose prose-neutral max-w-none">
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Historique des plans</h2>
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-neutral-900">{item.domain}</h3>
                    <p className="text-sm text-neutral-500">{item.budget} FCFA • {item.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => consultPlan(item.id)} className="p-2 text-neutral-600 hover:text-indigo-600"><Eye size={18} /></button>
                    <button onClick={() => deletePlan(item.id)} className="p-2 text-neutral-600 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
