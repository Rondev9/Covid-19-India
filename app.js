const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("*** Server is running at http://localhost:3000/ ***");
    });
  } catch (error) {
    console.log(`DB Error Message: ${error.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToStateDetails = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToDistrictDetails = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbObjectToStateDiseaseDetails = (dbObject) => {
  return {
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  };
};

// Get States Details

app.get("/states/", async (request, response) => {
  const stateDetailsQuery = `
    SELECT
      *  
    FROM
        state;`;
  const stateDetails = await db.all(stateDetailsQuery);
  response.send(
    stateDetails.map((eachState) => convertDbObjectToStateDetails(eachState))
  );
});

// Get a State Details by ID

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `
    SELECT
      *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const stateDetails = await db.get(stateIdQuery);
  response.send(convertDbObjectToStateDetails(stateDetails));
});

//Add a District

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Get District Details by Id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `
    SELECT
    *
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const districtDetails = await db.get(districtIdQuery);
  response.send(convertDbObjectToDistrictDetails(districtDetails));
});

//Remove a District

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update a District

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Stats of a Specific State

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsOfAStateQuery = `
    SELECT
        SUM(cases) AS total_cases,
        SUM(cured) AS total_cured,
        SUM(active) AS total_active,
        SUM(deaths) AS total_deaths
    FROM
        district NATURAL JOIN state
    WHERE
        state_id = ${stateId};`;
  const stateStats = await db.get(statsOfAStateQuery);
  response.send(convertDbObjectToStateDiseaseDetails(stateStats));
});

//Return a State Name of a district based on district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
    SELECT
        state.state_name
    FROM
        state INNER JOIN district
    ON district.state_id = state.state_id
    WHERE
        district_id = ${districtId};`;
  const stateName = await db.get(stateNameQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
