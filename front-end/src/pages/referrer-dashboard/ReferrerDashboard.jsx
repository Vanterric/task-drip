import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import getReferredUsers from "./getReferredUsers";
import referrerMapForDashboard from "./referrerMapForDashboard";
import SignupLineChart from "./SignupLineChart";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const ReferrerDashboard = () => {
  const {user} = useAuth();
  const [users, setUsers] = useState([]);
  const  [paidSubscribers, setPaidSubscribers] = useState(0);
  const [estimatedMonthlyPayout, setEstimatedMonthlyPayout] = useState(0);
  const [signUpsThisMonth, setSignUpsThisMonth] = useState(0);
  const [signUpsLastMonth, setSignUpsLastMonth] = useState(0);
  const [activeUsersThisMonth, setActiveUsersThisMonth] = useState(0);
  const [showSignUpsDetails, setShowSignUpsDetails] = useState(false);
  const [showActiveUsersDetails, setShowActiveUsersDetails] = useState(false);
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
      setSignUpsThisMonth(referredUsers.filter(user => {
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length);
      setSignUpsLastMonth(referredUsers.filter(user => {
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return createdAt.getMonth() === lastMonth.getMonth() && createdAt.getFullYear() === lastMonth.getFullYear();
      }).length);
      setActiveUsersThisMonth(referredUsers.filter(user => {
        console.log(user.lastActiveAt);
        if (!user.lastActiveAt) return false;
        const lastActive = new Date(user.lastActiveAt);
        const now = new Date();
        return lastActive.getMonth() === now.getMonth() && lastActive.getFullYear() === now.getFullYear();
      }).length);
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
    <div className="p-4 max-w-3xl mx-auto bg-[#212732]">
      <h1 className="text-2xl font-bold mb-2 flex justify-center mt-5">Referrer Dashboard</h1>
      <p className="flex justify-center mb-10 text-[#90A9D6] cursor-pointer" onClick={()=>window.location.href='/app'}>Back to DewList</p>
      <p>Welcome back, {referrerInfo.name}! 👋</p>
      <br/>
      <p className="mb-2">Share your unique referral link to earn {toPercentage(referrerInfo.percentShare)} on user subscriptions</p>
      <div className="bg-gray-100 p-4 rounded-lg mb-10">
        <p className="break-all text-[#4F5962] font-bold">
          https://dewlist.app/?referral={referrerInfo.referralLink}
        </p>
      </div>
      <hr className="my-6 border-gray-300" />
      <div className="mt-10 mb-10  flex justify-center flex-col items-center gap-2">
        <h2 className="text-xl font-semibold mb-2">{referrerInfo.referralLink === 'derrickgallegos'? "DewList User" :"Your Referral"} Metrics 💧</h2>
        <p>Total Signups: {users.length}</p>
        <p>Total Paid Subscribers: {paidSubscribers}</p>
        <p>{referrerInfo.referralLink === 'derrickgallegos' ? 'Expected Revenue':`Expected Pay Out`} This Month: ${estimatedMonthlyPayout} </p>
      </div>
      <hr className="my-6 border-gray-300" />
      <div  className="mt-10 mb-10">
        <h2 className="text-xl font-semibold mb2 flex justify-center">Signups This Month 🌱</h2>
        {showSignUpsDetails ? <p className="text-xs italic flex justify-center mt-1">{signUpsLastMonth > 0 ? `${Math.abs(((signUpsThisMonth - signUpsLastMonth) / signUpsLastMonth) * 100).toFixed(1)}% from last month` : 'No signups last month to compare'}</p>  : null}
        <div className="flex items-center gap-0 justify-center mt-5">
          <p className="text-2xl m-1">{signUpsThisMonth}</p>
          {signUpsLastMonth > 0 ? (
    <span
      className={`text-sm cursor-help ${signUpsThisMonth >= signUpsLastMonth ? 'text-green-500' : 'text-red-500'}`}
      title={`${Math.abs(((signUpsThisMonth - signUpsLastMonth) / signUpsLastMonth) * 100).toFixed(1)}% from last month`}
    >
      {signUpsThisMonth >= signUpsLastMonth ? 
      <ChevronUp className="h-4 w-4 text-green-500" onClick={()=>setShowSignUpsDetails(!showSignUpsDetails)} />
       : <ChevronDown className="h-4 w-4 text-red-500" onClick={()=>setShowSignUpsDetails(!showSignUpsDetails)} />}
    </span>
  ) : (
    <span
      className="text-sm text-gray-500 cursor-help"
      title="No signups last month to compare"
    >
      <Info className="h-4 w-4" onClick={()=>setShowSignUpsDetails(!showSignUpsDetails)} />
    </span>
  )}
        </div>
      </div>
      <hr className="my-6 border-gray-300" />
      <div  className="mt-10 mb-10">
        <h2 className="text-xl font-semibold mb2 flex justify-center">Active Users This Month 🫧</h2>
        {showActiveUsersDetails ? <p className="text-xs italic flex justify-center mt-1">User is considered active if they used DewList in the past 30 days.</p> : null}
        <div className="flex items-center gap-0 justify-center mt-5">
          <p className="text-2xl m-1">{activeUsersThisMonth}</p>
    <span
      className="text-sm text-gray-500 cursor-help"
      title="User is considered active if they used DewList in the past 30 days."
    >
      <Info onClick={()=>setShowActiveUsersDetails(!showActiveUsersDetails)} className="h-4 w-4" />
    </span>
        </div>
      </div>
      <hr className="my-6 border-gray-300" />
      <div className = 'mt-10'>
        <h2 className="text-xl font-semibold mb-2 flex justify-center">User Signups Over Time 🌊</h2>
        <SignupLineChart users={users} />
      </div>
    </div>
  );
}
export default ReferrerDashboard;