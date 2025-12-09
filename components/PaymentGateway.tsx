
import React, { useState } from 'react';
import { CreditCard, Check, Shield, Loader2, Lock, Star, Zap, X, IndianRupee } from 'lucide-react';
import { api } from '../services/api';

interface PaymentGatewayProps {
  onSuccess: (plan: 'credit' | 'subscription') => void;
  onClose: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onSuccess, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'credit' | 'subscription'>('subscription');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'plan' | 'card' | 'success'>('plan');

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const amount = selectedPlan === 'credit' ? 199 : 999;
      await api.processMockPayment(amount, selectedPlan);
      setStep('success');
      setTimeout(() => {
        onSuccess(selectedPlan);
        onClose();
      }, 2000);
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-green-400" />
            <span className="font-bold text-white">Secure Checkout</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'plan' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                  <Star className="text-white fill-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Upgrade Your Career</h3>
                <p className="text-slate-400 mt-2 text-sm">Unlock AI-powered Resume Tailoring & Cover Letter generation.</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedPlan('subscription')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                    selectedPlan === 'subscription' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'subscription' ? 'border-blue-500' : 'border-slate-500'}`}>
                      {selectedPlan === 'subscription' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Pro Monthly</div>
                      <div className="text-xs text-slate-400">Unlimited AI Generations</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">₹999</div>
                    <div className="text-xs text-green-400">Best Value</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPlan('credit')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                    selectedPlan === 'credit' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'credit' ? 'border-blue-500' : 'border-slate-500'}`}>
                      {selectedPlan === 'credit' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Single Use</div>
                      <div className="text-xs text-slate-400">One-time AI Generation</div>
                    </div>
                  </div>
                  <div className="font-bold text-white">₹199</div>
                </button>
              </div>

              <button 
                onClick={() => setStep('card')} 
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                Continue to Payment <Zap size={18} />
              </button>
            </div>
          )}

          {step === 'card' && (
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => setStep('plan')} className="text-sm text-slate-400 hover:text-white">Change Plan</button>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total Due</div>
                  <div className="font-bold text-white text-lg">₹{selectedPlan === 'subscription' ? '999' : '199'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                  <div className="relative">
                    <input 
                      required
                      type="text" 
                      placeholder="0000 0000 0000 0000"
                      value={cardDetails.number}
                      onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-mono"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry</label>
                    <input 
                      required
                      type="text" 
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                    <input 
                      required
                      type="text" 
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cardholder Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Shield size={18} />}
                  {isProcessing ? 'Processing...' : `Pay ₹${selectedPlan === 'subscription' ? '999' : '199'}`}
                </button>
                <div className="text-center mt-3 text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Lock size={10} /> 256-bit SSL Secure Payment
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-green-500" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-400">Your account has been upgraded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
