export const formatCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    return `${isNegative ? '-' : ''}₹${(absAmount / 10000000).toFixed(2)}Cr`;
  }
  if (absAmount >= 100000) {
    return `${isNegative ? '-' : ''}₹${(absAmount / 100000).toFixed(2)}L`;
  }

  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
};

export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatGreeks = (value: number): string => {
  return value.toFixed(4);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const getRiskColor = (level: string): string => {
  switch (level) {
    case 'safe':
      return '#3FB950';
    case 'caution':
      return '#D29922';
    case 'danger':
      return '#F85149';
    case 'critical':
      return '#F85149';
    default:
      return '#3FB950';
  }
};

export const getRiskBgColor = (level: string): string => {
  switch (level) {
    case 'safe':
      return 'rgba(63, 185, 80, 0.15)';
    case 'caution':
      return 'rgba(210, 153, 34, 0.15)';
    case 'danger':
      return 'rgba(248, 81, 73, 0.15)';
    case 'critical':
      return 'rgba(248, 81, 73, 0.25)';
    default:
      return 'rgba(63, 185, 80, 0.15)';
  }
};

export const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'danger':
      return '🟠';
    case 'warning':
      return '🟡';
    case 'safe':
      return '🟢';
    default:
      return '⚪';
  }
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#D29922';
  if (score >= 40) return '#F85149';
  return '#F85149';
};
