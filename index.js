import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  database: "database",
  password: "password",
  host: "localhost",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Pushing visited countries from Database to Array
async function getVisited() {
  let countries = [];
  let result = await db.query("SELECT country_code FROM visited_countries");
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
};

// Home Page with visited countries from Array
app.get("/", async (req, res) => {
  let arrayOfCodes = await getVisited();
  res.render("index.ejs", {
    countries: arrayOfCodes,
    total: arrayOfCodes.length,
  });
});

// Adding countries to a Table of visited countries and a map
app.post("/add", async (req, res) => {
  let input = req.body["country"];
  let inputCode;
  try {
  // Checking an inputed country in a Table of All countries
  inputCode = await db.query(
    "SELECT country_code from countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [input.toLowerCase()]
  );
  // If is:
  if (inputCode !== 0) {
    let inputCodeToString = inputCode.rows[0].country_code;
    console.log(inputCodeToString);
    try {
    // Inserting code of inputed country into visited countries
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [inputCodeToString]);
    res.redirect("/");
    } catch (error) {
    // If country already exists in a table of visited countries
      const countries = await getVisited();
      res.render("index.ejs", {
        error: "Country has already been chosen. Choose another.",
        countries: countries, 
        total: countries.length
      });
    };
  };
    } catch (error) {
      // If country wasn't find in a table of all countries
      const countries = await getVisited();
      res.render("index.ejs", {
        error: "Country does not exist. Try again.",
        countries: countries, 
        total: countries.length
      });
  };
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
