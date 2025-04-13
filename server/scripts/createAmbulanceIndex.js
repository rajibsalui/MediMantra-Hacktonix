import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const createAmbulanceIndex = async () => {
  try {
    // Connect to MongoDB and wait for the connection to be established
    await mongoose.connect(process.env.MONGODB_URL);
    console.log(chalk.green('✓ Connected to MongoDB'));
    // Wait a moment to ensure the connection is fully established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the ambulances collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not fully established');
    }
    const ambulancesCollection = db.collection('ambulances');

    // Drop any existing indexes on the location field
    console.log(chalk.yellow('Dropping existing indexes on location field...'));
    try {
      await ambulancesCollection.dropIndex('location_2dsphere');
      console.log(chalk.green('✓ Existing index dropped'));
    } catch (error) {
      console.log(chalk.yellow('No existing index to drop or error dropping index'));
    }

    // Create the 2dsphere index
    console.log(chalk.blue('Creating 2dsphere index for geospatial queries...'));
    await ambulancesCollection.createIndex({ "location": "2dsphere" });
    console.log(chalk.green('✓ 2dsphere index created successfully'));

    // List all indexes to verify
    console.log(chalk.blue('Listing all indexes:'));
    const indexes = await ambulancesCollection.indexes();
    console.log(indexes);

    console.log(chalk.green.bold('✓ Index creation completed successfully!'));
  } catch (error) {
    console.error(chalk.red('✗ Error creating index:'), error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log(chalk.green('✓ Disconnected from MongoDB'));
  }
};

// Run the function
createAmbulanceIndex();
