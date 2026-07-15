const Collection = require("../../models/collection");

// Get Active Collections
const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find(
      { status: true },
      {
        Name: 1,
        image: 1,
        slug: 1,
      }
    ).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCollections,
};
