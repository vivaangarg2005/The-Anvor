import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrderById } from '../../../lib/api';
import OrderSuccessClient from './OrderSuccessClient';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  let order = null;
  try {
    const res = await getOrderById(resolvedParams.id, cookieHeader);
    if (res && res.success) {
      order = res.data;
    } else {
      redirect('/account');
    }
  } catch (err) {
    console.error(err);
    redirect('/account');
  }

  if (!order) {
    redirect('/account');
  }

  return <OrderSuccessClient order={order} />;
}
