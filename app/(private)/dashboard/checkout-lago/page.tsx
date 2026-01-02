'use client';
import { useRouter } from 'next/navigation';

export default function CheckoutLago() {
  const router = useRouter();
  const handlePayment = async () => {
    const response = await fetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', name: 'Nom Utilisateur', planCode: 'premium_plan' }),
    });
    const subscription = await response.json();
    router.push(`/dashboard/payment-return?status=success&subscription_id=${subscription.lagoId}`);
  };

  return (
    <div className="p-4">
      <h1>Checkout with Lago</h1>
      <button 
        onClick={handlePayment}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Confirmer l'abonnement
      </button>
    </div>
  );
}
