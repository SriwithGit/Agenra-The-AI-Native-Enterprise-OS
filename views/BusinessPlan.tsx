import React from 'react';
import { Download, TrendingUp, Target, Shield, Globe, DollarSign, Award, ChevronRight, Building2, Users, IndianRupee } from 'lucide-react';

const BusinessPlan: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in bg-white text-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-5xl mx-auto my-8 print:m-0 print:shadow-none print:max-w-none print:w-full">
      
      {/* Control Bar (Hidden in Print) */}
      <div className="bg-slate-900 p-4 flex justify-between items-center print:hidden border-b border-slate-700">
        <h2 className="text-white font-bold text-xl flex items-center gap-2">
          <Globe className="text-blue-400" /> Agenra India Strategic Plan
        </h2>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
        >
          <Download size={18} /> Print / Save as PDF
        </button>
      </div>

      {/* Document Content */}
      <div className="p-12 print:p-8 space-y-12">
        
        {/* Title Page */}
        <div className="text-center border-b-2 border-slate-900 pb-12">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-slate-900">AGENRA</h1>
          <p className="text-2xl text-slate-600 font-light uppercase tracking-widest">Enterprise Orchestration for India</p>
          <div className="mt-8 flex justify-center gap-4 text-sm font-bold text-slate-500">
            <span>STRATEGIC ROADMAP 2026-2029</span>
            <span>•</span>
            <span>BHARAT MARKET ANALYSIS</span>
            <span>•</span>
            <span>SOLO-FOUNDER EXECUTION</span>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section>
          <h3 className="text-2xl font-bold border-l-4 border-blue-600 pl-4 mb-6 uppercase">1. Executive Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="prose text-slate-600">
              <p>
                <strong>The "Unified Bharat" Advantage:</strong> Indian MSMEs suffer from software fragmentation (Tally for accounts, Naukri for hiring, WhatsApp for ops). Agenra unifies these into a single "Tenant" OS tailored for the Indian ecosystem, integrating GST compliance, UPI billing, and local HR norms.
              </p>
              <p className="mt-4">
                <strong>The Solo-Founder Edge:</strong> Leveraging India's cost advantage and AI (Gemini) for coding and support allows us to operate with extreme efficiency. We focus on high-ticket B2B sales to Tech Parks (Bengaluru, Hyderabad, Gurugram) and Tier-2 industrial hubs.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={20} className="text-blue-600"/> Core Objectives</h4>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><ChevronRight size={16} className="text-blue-500 shrink-0"/> <strong>Consolidate:</strong> Replace 4-5 subscriptions (HRMS, CRM, IT Assets).</li>
                <li className="flex gap-2"><ChevronRight size={16} className="text-blue-500 shrink-0"/> <strong>Automate:</strong> Use Gemini Agents for L1 Support & Recruitment.</li>
                <li className="flex gap-2"><ChevronRight size={16} className="text-blue-500 shrink-0"/> <strong>Bootstrap:</strong> Reach ₹10 Lakh MRR before seeking Series A.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Financial Roadmap & Credits */}
        <section className="break-inside-avoid">
          <h3 className="text-2xl font-bold border-l-4 border-green-600 pl-4 mb-6 uppercase">2. Resource Acquisition</h3>
          
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Award className="text-orange-500" /> Google for Startups India (Cloud Credits)
              </h4>
              <p className="text-slate-600 text-sm mb-4">
                To run Agenra's AI-heavy backend (Gemini 2.5 Pro/Flash) cost-effectively, we leverage the Google for Startups program.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <strong>Step 1: Application</strong>
                  <p className="text-slate-500 mt-1">Apply to "Google for Startups Cloud Program India". Requirement: DPIIT Recognition (Startup India).</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <strong>Step 2: Benefit</strong>
                  <p className="text-slate-500 mt-1">Grants up to $200,000 (~₹1.6 Cr) in credits for Firebase, Cloud Run, and Vertex AI.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <strong>Step 3: Utilization</strong>
                  <p className="text-slate-500 mt-1">Host backend on Cloud Run (Mumbai Region). Use credits to offset "Voice Agent" API calls.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <IndianRupee className="text-green-500" /> Investment Strategy
              </h4>
              <p className="text-slate-600 text-sm">
                <strong>Phase 1 (Bootstrapped):</strong> Use personal funds (~₹50k/mo). Focus on 2-3 Beta Clients in Bengaluru/NCR.
                <br/>
                <strong>Phase 2 (Seed):</strong> Once at ₹5L MRR, apply to Indian accelerators like <strong>Peak XV (Surge)</strong> or <strong>Y Combinator</strong>. Pitch: "The OS for AI-Native Indian SMEs".
                <br/>
                <strong>Phase 3 (Growth):</strong> Target domestic VC firms specializing in SaaS (SaaSBOOMi network).
              </p>
            </div>
          </div>
        </section>

        {/* 3. Target Audience (Top 50 Types) */}
        <section className="break-inside-avoid">
          <h3 className="text-2xl font-bold border-l-4 border-purple-600 pl-4 mb-6 uppercase">3. Target Sectors (India Focus)</h3>
          <p className="text-slate-600 mb-6">Focus on Mid-Market companies (50-500 employees) transitioning from legacy software to Cloud.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-700">
            <div className="space-y-2">
              <div className="font-bold text-slate-900 border-b pb-1 mb-2">IT & BPO</div>
              <div>1. IT Services (SMEs)</div>
              <div>2. BPO/KPO Centers</div>
              <div>3. SaaS Startups</div>
              <div>4. Cybersec Firms</div>
              <div>5. EdTech Platforms</div>
              <div>6. Fintech Apps</div>
              <div>7. Digital Marketing</div>
              <div>8. Data Analytics</div>
              <div>9. Web3/Blockchain</div>
              <div>10. Mobile Dev Shops</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-slate-900 border-b pb-1 mb-2">Services</div>
              <div>11. CA Firms</div>
              <div>12. Law Firms</div>
              <div>13. HR Consultancies</div>
              <div>14. Real Estate Agencies</div>
              <div>15. Architecture Firms</div>
              <div>16. Event Management</div>
              <div>17. Travel Agencies</div>
              <div>18. Coaching Centers</div>
              <div>19. Interior Design</div>
              <div>20. Logistics/3PL</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-slate-900 border-b pb-1 mb-2">Health & Retail</div>
              <div>21. Private Hospitals</div>
              <div>22. Dental Chains</div>
              <div>23. IVF Clinics</div>
              <div>24. Gym Franchises</div>
              <div>25. D2C Brands</div>
              <div>26. Cloud Kitchens</div>
              <div>27. Retail Chains</div>
              <div>28. Salons/Spas</div>
              <div>29. Pharmacies</div>
              <div>30. Diagnostic Labs</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-slate-900 border-b pb-1 mb-2">Emerging/Niche</div>
              <div>31. NGOs</div>
              <div>32. Solar EPC</div>
              <div>33. EV Startups</div>
              <div>34. Coworking Spaces</div>
              <div>35. Media Houses</div>
              <div>36. AgriTech</div>
              <div>37. Construction</div>
              <div>38. Textile Exports</div>
              <div>39. Gaming Studios</div>
              <div>40. Creator Economy</div>
            </div>
          </div>
        </section>

        {/* 4. 3-Year Execution Plan */}
        <section className="break-inside-avoid">
          <h3 className="text-2xl font-bold border-l-4 border-indigo-600 pl-4 mb-6 uppercase">4. Execution Roadmap</h3>
          
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600"></div>
              <h4 className="font-bold text-lg text-slate-900">Year 1: Validation (2026)</h4>
              <p className="text-slate-600 mt-1">
                <strong>Goal:</strong> 10 Paid Tenants (₹5 Lakh ARR).
                <br/>
                <strong>Focus:</strong> Perfect "Recruiting" for high-churn BPOs and "ITAM" for remote teams.
                <br/>
                <strong>Tech:</strong> Robust India-stack integration (UPI, GST invoicing).
              </p>
            </div>
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300"></div>
              <h4 className="font-bold text-lg text-slate-900">Year 2: Expansion (2027)</h4>
              <p className="text-slate-600 mt-1">
                <strong>Goal:</strong> 50 Paid Tenants (₹50 Lakh ARR).
                <br/>
                <strong>Focus:</strong> Public Job Board monetization. Partner with coworking spaces for distribution.
                <br/>
                <strong>Tech:</strong> Hire 1 Support Engineer and 1 Sales Rep in Bengaluru.
              </p>
            </div>
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300"></div>
              <h4 className="font-bold text-lg text-slate-900">Year 3: Scale (2028)</h4>
              <p className="text-slate-600 mt-1">
                <strong>Goal:</strong> 200 Paid Tenants (₹2 Cr ARR).
                <br/>
                <strong>Focus:</strong> Full AI Autonomy. Marketing push for "Bharat's Enterprise OS".
                <br/>
                <strong>Exit Strategy?</strong> Acquisition by larger Indian ERP players (Zoho, Freshworks).
              </p>
            </div>
          </div>
        </section>

        {/* 5. Competitor Analysis */}
        <section className="break-inside-avoid">
          <h3 className="text-2xl font-bold border-l-4 border-red-600 pl-4 mb-6 uppercase">5. Competitive Landscape (India)</h3>
          
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-4">Competitor</th>
                  <th className="p-4">Weakness</th>
                  <th className="p-4">Agenra's Counter-Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 font-bold text-slate-900">Zoho One</td>
                  <td className="p-4 text-slate-600">Complex configuration, requires implementation partners.</td>
                  <td className="p-4 text-blue-600 font-medium">"Zero-Config". Pre-set for Indian SMEs. Ready in 5 mins.</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900">Keka / GreytHR</td>
                  <td className="p-4 text-slate-600">Great for HR/Payroll, but lack CRM, ITAM, and AI Agents.</td>
                  <td className="p-4 text-blue-600 font-medium">Unified suite. Hiring triggers IT & Payroll automatically.</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900">Tally</td>
                  <td className="p-4 text-slate-600">Legacy UX, desktop-first, limited to accounting.</td>
                  <td className="p-4 text-blue-600 font-medium">Cloud-native, AI-first, mobile-ready.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Conclusion */}
        <div className="bg-slate-900 text-white p-8 rounded-xl text-center">
          <h4 className="text-xl font-bold mb-4">Conclusion</h4>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Agenra succeeds by simplifying the fragmented Indian software stack. 
            By providing a unified, AI-native platform at an affordable price point for the Indian mid-market, 
            we can build a highly profitable, resilient business rooted in Bharat.
          </p>
          <div className="mt-6 text-sm text-slate-500 uppercase tracking-widest">
            Prepared by Agenra India • December 2025
          </div>
        </div>

      </div>
    </div>
  );
};

export default BusinessPlan;