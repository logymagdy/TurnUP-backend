const calculateWaitTime = (entries) => {
  const activeStatuses = ["WAITING", "ARRIVED", "IN_SERVICE"];
  const entriesAhead = entries.filter((entry) =>
    activeStatuses.includes(entry.status)
  );

  const totalWait = entriesAhead.reduce((sum, entry) => {
    const min = entry.service?.durationMin || 0;
    const max = entry.service?.durationMax || 0;
    const avg = (min + max) / 2;
    return sum + avg;
  }, 0);

  return Math.ceil(totalWait);
};

module.exports = { calculateWaitTime };