const mongoose = require("mongoose");
const Collection = require("../../models/collection");

// Create Collection
const createCollection = async (req, res) => {
  try {
    const { Name, status } = req.body;

    if (!Name) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Collection image is required.",
      });
    }

    const existingCollection = await Collection.findOne({
      Name: Name.trim(),
    });

    if (existingCollection) {
      return res.status(409).json({
        success: false,
        message: "Collection already exists.",
      });
    }

    const collection = await Collection.create({
      Name: Name.trim(),
      image: `/uploads/${req.file.filename}`,
      status: status === undefined ? true : status,
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      data: collection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Collections
const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({
      createdAt: -1,
    });

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

// Get Collection By ID
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Collection
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    const currentName = collection.Name || "";

    if (
      Name &&
      Name.trim().toLowerCase() !== currentName.toLowerCase()
    ) {
      const existingCollection = await Collection.findOne({
        Name: Name.trim(),
      });

      if (existingCollection) {
        return res.status(409).json({
          success: false,
          message: "Collection name already exists.",
        });
      }

      collection.Name = Name.trim();
    }

    if (status !== undefined) {
      collection.status = status;
    }

    if (req.file) {
      collection.image = `/uploads/${req.file.filename}`;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      data: collection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Collection
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    await Collection.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
};