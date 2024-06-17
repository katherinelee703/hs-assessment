const express = require('express');
const axios = require('axios');
const moment = require('moment');

const app = express();

const USER_KEY = '5f8cf096180cb35d0cc251b74d13';
// I would normally keep USER_KEY in a .ENV file, but I'm putting it here for sake of submitting assessment code

const logData = (data) => {
  console.log('data inner', data);
};

const handleGetUniqueCompanies = (data) => {
  // reformat according to exam question
  const callRecords = data.callRecords; // an array of objects for each call that happened
  // const dateExample = moment('1670000400', 'X').format('YYYY-MM-DD');
  // console.log(dateExample);
  // get an array of objects for each company, ie how many unique companies
  let companies = [];
  for (let i = 0; i < callRecords.length; i++) {
    companies.push(callRecords[i].customerId);
  }
  let uniqueCompaniesSet = new Set(companies);
  console.log('uniqueCompanies: ', uniqueCompaniesSet); // we have 11 unique companies
  // now, forEach company, we need to get a list of calls
  // get an array of call Ids that happened on the same day, run thru callRecords and find company
  // get an array of any calls that overlapped on that day, and list how many in maxConcurrentCalls

  let results = [];
  uniqueCompaniesSet.forEach((company) => {
    results.push(...handlePerCustomer(company, callRecords));
  });

  return { results }; // POST THIS
};

const handlePerCustomer = (customerId, callRecords) => {
  let recordsPerDay = {};
  let records = callRecords.filter(
    (record) => record.customerId === customerId
  );
  for (let rec of records) {
    let date = moment(rec.startTimestamp, 'X').format('YYYY-MM-DD');
    if (recordsPerDay[date]) {
      recordsPerDay[date].push(rec);
    } else {
      recordsPerDay[date] = [rec];
    }
  }
  console.log('recperday: ', recordsPerDay);
  // Find overlaps in each day
  let callRecordArraysForDate = Object.values(recordsPerDay);
  for (let records of callRecordArraysForDate) {
    // find overlapping times
    findOverlapsPerDay(records, customerId); // put in array?
  }

  let overlaps = [];
  for (const [date, records] of Object.entries(callRecordArraysForDate)) {
    overlaps.push(...findOverlapsPerDay(records, customerId, date));
  }
  console.log('OVL', overlaps);
  return overlaps;
};

const findOverlapsPerDay = (records, customerId, date) => {
  let overlappingCalls = [];
  let timestamps = [];
  for (let rec of records) {
    let start = rec.startTimestamp + '-' + rec.customerId + '-begin';
    timestamps.push(start);
    let end = rec.endTimestamp + '-' + rec.customerId + '-end';
    timestamps.push(end);
  }
  // console.log('CIDTS', customerId, timestamps);
  let queue = [];
  let maxCallCount = 0;
  for (let timestamp of timestamps) {
    let arr = timestamp.split('-');
    let time = arr[0];
    let callid = arr[1];
    let status = arr[2];
    if (status === 'begin') {
      queue.push(callid);
    }
    if (maxCallCount <= queue.length) {
      maxCallCount = queue.length;
      let result = {
        customerId: customerId,
        date: date,
        maxConcurrentCalls: maxCallCount,
        timestamp: time,
        callIds: queue,
      };
      overlappingCalls.push(result);
    }
    if (status === 'end') {
      console.log('HOOP', queue.includes(callid), queue.indexOf(callid));
      // PROBLEM HERE... setting up the queue to find overlaps this way seems to be an issue
      // queue.pop();
    }
  }
  //max callcount is largest here
  let realOverlaps = overlappingCalls.filter((result) => {
    return result.callIds.length === maxCallCount;
  });
  console.log('REOV', realOverlaps);
  return realOverlaps;
};

app.get('/dataset', async (req, res) => {
  const dataset = `https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=${USER_KEY}`;
  let result;
  try {
    const resp = await axios.get(dataset);
    const data = resp.data; // edit this to dig into the object as needed
    // logData(data);
    console.log('resppp: ', resp.data);
    result = handleGetUniqueCompanies(data);
    // res.send(data.callRecords);
    // res.send(result);
    console.log('testestest', result);
  } catch (error) {
    console.error(error);
  }
  try {
    await axios.post(
      `https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=${USER_KEY}`,
      result
    );
  } catch (err) {
    console.error(err);
  }
});

// leave a handy link to localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
