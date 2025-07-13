// Utility functions for voting session status management

export const getSessionStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return {
      status: 'upcoming' as const,
      label: 'Upcoming',
      color: 'bg-blue-100 text-blue-700',
      canVote: false
    };
  } else if (now >= start && now <= end) {
    return {
      status: 'ongoing' as const,
      label: 'Live Now',
      color: 'bg-green-100 text-green-700',
      canVote: true
    };
  } else {
    return {
      status: 'ended' as const,
      label: 'Ended',
      color: 'bg-gray-100 text-gray-700',
      canVote: false
    };
  }
};

export const getTimeRemaining = (endTime: string) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

export const isSessionActive = (startTime: string, endTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
};

export const hasSessionStarted = (startTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  return now >= start;
};

export const hasSessionEnded = (endTime: string) => {
  const now = new Date();
  const end = new Date(endTime);
  return now > end;
};