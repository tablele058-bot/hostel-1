import { MongoClient } from "mongodb";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = "mongodb://r99892921_db_user:9o1wG7kB3in90KMq@cluster0.ovdkjqw.mongodb.net:27017/pgsmart?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function setup() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db("pgsmart");
  console.log("Connected to Atlas");

  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.collection(c.name).drop();
    console.log("Dropped:", c.name);
  }

  await db.createCollection("users");
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  console.log("Created: users");

  await db.createCollection("properties");
  await db.collection("properties").createIndex({ city: 1 });
  await db.collection("properties").createIndex({ propertyType: 1 });
  await db.collection("properties").createIndex({ "seller._id": 1 });
  console.log("Created: properties");

  const samples = [
    { title: "Cozy Shared PG in Andheri", description: "Affordable shared accommodation in the heart of Andheri West. Walking distance to metro.", price: 8500, city: "Mumbai", area: "Andheri West", pincode: "400053", propertyType: "flat", bhk: "2", bathrooms: 2, areaSize: 850, furnishing: "furnished", status: "rent", amenities: ["Wifi", "Security", "Power Backup", "Laundry"], images: [], views: 42, createdAt: new Date(Date.now() - 86400000 * 2) },
    { title: "Premium Girls PG with Meals", description: "Safe PG for working women with home-cooked meals, AC, and 24/7 security.", price: 12000, city: "Pune", area: "Koregaon Park", pincode: "411001", propertyType: "villa", bhk: "3", bathrooms: 3, areaSize: 2000, furnishing: "furnished", status: "rent", amenities: ["Meals", "AC", "Wifi", "Security", "Garden"], images: [], views: 78, createdAt: new Date(Date.now() - 86400000 * 5) },
    { title: "Budget Room for Students", description: "Perfect for students near tech park. Affordable rent with basic amenities.", price: 5500, city: "Bangalore", area: "Whitefield", pincode: "560066", propertyType: "flat", bhk: "1", bathrooms: 1, areaSize: 450, furnishing: "semi-furnished", status: "rent", amenities: ["Wifi", "Power Backup", "Security"], images: [], views: 35, createdAt: new Date(Date.now() - 86400000 * 3) },
    { title: "Luxury Executive PG", description: "Premium PG with attached bathroom, kitchen access, and rooftop terrace.", price: 18000, city: "Delhi", area: "Dwarka", pincode: "110075", propertyType: "penthouse", bhk: "4", bathrooms: 4, areaSize: 3000, furnishing: "furnished", status: "rent", amenities: ["AC", "Wifi", "Gym", "Security", "Garden"], images: [], views: 120, createdAt: new Date(Date.now() - 86400000 * 7) },
    { title: "Working Professionals Co-Living", description: "Prime co-living in business district with coworking area and high-speed internet.", price: 15000, city: "Mumbai", area: "BKC", pincode: "400051", propertyType: "commercial", bhk: "0", bathrooms: 2, areaSize: 1200, furnishing: "furnished", status: "rent", amenities: ["Wifi", "Coworking", "Cafe", "Security", "AC"], images: [], views: 55, createdAt: new Date(Date.now() - 86400000 * 10) },
    { title: "Spacious PG with Garden", description: "Large independent PG house with backyard, parking, and separate entrance.", price: 9500, city: "Chennai", area: "Adyar", pincode: "600020", propertyType: "villa", bhk: "3", bathrooms: 3, areaSize: 1800, furnishing: "semi-furnished", status: "rent", amenities: ["Parking", "Garden", "Wifi", "Security"], images: [], views: 62, createdAt: new Date() },
  ];
  await db.collection("properties").insertMany(samples);
  console.log("Inserted 6 sample PGs");

  console.log("\nDatabase setup complete!");
  await client.close();
}

setup().catch(err => { console.error("Failed:", err.message); process.exit(1); });
