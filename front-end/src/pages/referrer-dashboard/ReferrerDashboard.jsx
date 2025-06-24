import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import getReferredUsers from "./getReferredUsers";
import referrerMapForDashboard from "./referrerMapForDashboard";
import SignupLineChart from "./SignupLineChart";

const ReferrerDashboard = () => {
  const {user} = useAuth();
  const [users, setUsers] = useState([]);
  const  [paidSubscribers, setPaidSubscribers] = useState(0);
  const [estimatedMonthlyPayout, setEstimatedMonthlyPayout] = useState(0);
  const MONTHLY_PRICE = 5;
  const YEARLY_PRICE = 30;
  const LIFETIME_PRICE = 100;

  const referrerInfo = referrerMapForDashboard(user.email);
  

  const toPercentage = (num) => `${Math.round(num * 100)}%`;


 useEffect(() => {
    const fetchReferredUsers = async () => {
      const referredUsers = await getReferredUsers(referrerInfo.referralLink);
      setUsers(referredUsers);
      const paidCount = referredUsers.filter(user => user.proSubscriptionType).length;
      setPaidSubscribers(paidCount);
      const monthlySubscriberCount = referredUsers.filter(user => user.proSubscriptionType === 'monthly').length;
      const yearlySubscriberCount = referredUsers.filter(user => user.proSubscriptionType === 'yearly').length;
      const foreverSubscriberCount = referredUsers.filter(user => user.proSubscriptionType === 'lifetime').length;
      const countOfForeverSubscribersThatSignedUpThisMonth = referredUsers.filter(user => {
        if (user.proSubscriptionType !== 'lifetime' || !user.lastDatePaid) return false;
        const lastDatePaid = new Date(user.lastDatePaid);
        const now = new Date();
        return lastDatePaid.getMonth() === now.getMonth() && lastDatePaid.getFullYear() === now.getFullYear();
      }).length;
      const estimatedPayout = (monthlySubscriberCount * MONTHLY_PRICE + yearlySubscriberCount * (YEARLY_PRICE / 12) + countOfForeverSubscribersThatSignedUpThisMonth * (LIFETIME_PRICE));
      setEstimatedMonthlyPayout((estimatedPayout * referrerInfo.percentShare).toFixed(2));
    }
    fetchReferredUsers();
  }, [referrerInfo.referralLink]);

  
if (!user.isReferrer) {
    return <div className="p-4 flex h-[100vh] w-[100vw] justify-center items-center">You are not part of the referrer program.</div>;
  }
  if (!referrerInfo) {
    return <div className="p-4 flex h-[100vh] w-[100vw] justify-center items-center">Looks like we can't get your information right now. For help, reach out to support@dewlist.app</div>;
  }
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex justify-center">Referrer Dashboard</h1>
      <p>Welcome back, {referrerInfo.name}!</p>
      <br/>
      <p className="mb-2">Share your unique referral link to earn {toPercentage(referrerInfo.percentShare)} on user subscriptions</p>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="break-all text-[#4F5962] font-bold">
          https://dewlist.app/?referral={referrerInfo.referralLink}
        </p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">{referrerInfo.referralLink === 'derrickgallegos'? "DewList User" :"Your Referral"} Metrics</h2>
        <p>Total Signups: {users.length}</p>
        <p>Total Paid Subscribers: {paidSubscribers}</p>
        <p>{referrerInfo.referralLink === 'derrickgallegos' ? 'Expected Revenue':`Expected Pay Out`} This Month: ${estimatedMonthlyPayout} </p>
      </div>
      <div className = 'mt-4'>
        <h2 className="text-xl font-semibold mb-2">User Signups Over Time</h2>
        <SignupLineChart users={users} />
      </div>
    </div>
  );
}
export default ReferrerDashboard;