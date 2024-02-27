const Pet = require("../models/pet.model");
const Post = require("../models/post.model");
const path = require("path");

//Function to create a new pet
const addPet = async (req, res) => {
  let {
    name,
    age,
    type,
    breed,
    breed_description,
    description,
    story,
    status = "AVAILABLE",
    image = "default_pet_image.png",
  } = req.body;

  //Paremeter exist validation
  if (
    !name ||
    !age ||
    !type ||
    !breed ||
    !breed_description ||
    !description ||
    !story
  ) {
    return res.status(400).send({ message: "all fileds are required" });
  }

  try {
    //Pet already exists validation
    const existingPet = await Pet.findOne({ name });

    //Description validation
    if (
      breed_description.length < 5 ||
      description.length < 5 ||
      story.length < 5
    ) {
      return res.status(400).send({ message: "not enough information given" });
    }
    //Age validation
    if (age < 0) {
      return res.status(400).send({ message: "age cannot be negative" });
    }

    //pet name
    const trimmedName = name.trim();
    const nameParts = trimmedName.split(" ");
    const capitalizedNames = nameParts.map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1)
    );
    name = capitalizedNames.join(" ");

    //category
    const validStatus = ["AVAILABLE", "ADOPTED", "LOST", "FOUND"];
    if (!validStatus.includes(status)) {
      return res.status(400).send({ message: "status does not exist" });
    }

    //image
    if (req.files && req.files.image) {
      if (Array.isArray(req.files.image)) {
        return res
          .status(400)
          .send({ message: "Only one image can be uploaded at a time" });
      }
      const imageFile = req.files.image;

      const imageExtension = path.extname(imageFile.name);
      const imageName = `${name}-${Date.now()}${imageExtension}`;

      const imageDir = path.join(__dirname, "../public/images/pets", imageName);
      await imageFile.mv(imageDir).catch((err) => {
        console.error(err);
        return res.status(500).send({ message: "Error uploading image" });
      });

      image = imageName;
    }

    const pet = new Pet({
      name,
      age,
      type,
      breed,
      breed_description,
      description,
      story,
      status,
      image,
    });
    await pet.save();
    return res.status(200).send({ pet, status: "success" });
  } catch (error) {
    // Catch and handle the MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).send({ message: "Pet name already exists" });
    } else {
      console.error("Error occurred:", error);
      return res.status(500).send({ error: "Internal Server Error" });
    }
  }
};

//Function to edit pet information
const editPet = async (req, res) => {
  let {
    name,
    age,
    type,
    breed,
    breed_description,
    description,
    story,
    status,
    image,
  } = req.body;

  if (!name) {
    return res.status(404).send({ message: "field required" });
  }
  let updatedValues = {};

  const trimmedName = name.trim();
  const nameParts = trimmedName.split(" ");
  const capitalizedNames = nameParts.map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1)
  );
  name = capitalizedNames.join(" ");
  try {
    const pet = await Pet.findOne({ name });
    if (!pet) {
      return res.status(404).send({ message: "Pet not found" });
    }

    if (age) {
      if (age < 0) {
        return res.status(400).send({ message: "age cannot be negative" });
      }
      updatedValues.age = age;
    }
    if (status) {
      const validStatus = ["AVAILABLE", "ADOPTED", "LOST", "FOUND"];
      if (!validStatus.includes(status)) {
        return res.status(400).send({ message: "status does not exist" });
      }
      updatedValues.status = status;
    }
    if (type) {
      updatedValues.type = type;
    }
    if (breed) {
      updatedValues.breed = breed;
    }
    if (breed_description) {
      if (breed_description.length < 5) {
        return res
          .status(400)
          .send({ message: "not enough information given" });
      }
      updatedValues.breed_description = breed_description;
    }
    if (description) {
      if (description.length < 5) {
        return res
          .status(400)
          .send({ message: "not enough information given" });
      }
      updatedValues.description = description;
    }
    if (story) {
      if (story.length < 5) {
        return res
          .status(400)
          .send({ message: "not enough information given" });
      }
      updatedValues.story = story;
    }

    if (req.files && req.files.image) {
      if (Array.isArray(req.files.image)) {
        return res
          .status(400)
          .send({ message: "Only one image can be uploaded at a time" });
      }
      const imageFile = req.files.image;

      const imageExtension = path.extname(imageFile.name);
      const imageName = `${name}-${Date.now()}${imageExtension}`;

      const imageDir = path.join(__dirname, "../public/images/pets", imageName);
      await imageFile.mv(imageDir).catch((err) => {
        console.error(err);
        return res.status(500).send({ message: "Error uploading image" });
      });
      updatedValues.image = imageName;
    }
    await Pet.findByIdAndUpdate(pet._id, updatedValues);
    const updatedPet = await Pet.findById(pet._id);
    return res.status(200).send({ message: "pet updated", pet: updatedPet });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//Function to get all pets to display them
const getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find();
    return res.status(200).json({ pets: pets });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//Function to get a specific pet by its name(unique)
const getPet = async (req, res) => {
  try {
    let name = req.params.name;
    const trimmedName = name.trim();
    const nameParts = trimmedName.split(" ");
    const capitalizedNames = nameParts.map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1)
    );
    name = capitalizedNames.join(" ");
    const pet = await Pet.findOne({ name });

    if (!pet) {
      return res.status(404).send({ message: "pet not found" });
    }

    res.status(200).json({ pet: pet });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

//Function to delete a pet if needed
const deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const pet = await Pet.findByIdAndDelete(petId);

    if (!pet) {
      return res.status(404).send({ message: "pet not found" });
    }

    return res.status(200).send({ message: "pet deleted successfully" });
  } catch (error) {
    return res.status(500).send({ message: "pet not found" });
  }
};

//Function to filter pets by type or age
const filterPet = async (req, res) => {
  let { filter, value } = req.body;

  //filter by type
  if (filter === "type") {
    const validtypes = ["dogs", "cats", "fish", "rabbits", "others"];
    if (!validtypes.includes(value)) {
      return res.status(400).send({ message: "type does not exist" });
    }
    try {
      const filteredPets = [];
      const pets = await Pet.find();
      pets.map((pet) => {
        if (pet.type === value) filteredPets.push(pet);
      });
      if (filteredPets.length == 0) {
        return res.status(204).send({ message: "no pets found" });
      }
      return res.status(200).send({ filteredPets: filteredPets });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  }

  //filter by age
  if (filter === "age") {
    if (value < 0) {
      return res.status(400).send({ message: "age cannot be negative" });
    }
    try {
      const filteredPets = [];
      const pets = await Pet.find();
      pets.map((pet) => {
        if (pet.age < value) filteredPets.push(pet);
      });
      if (filteredPets.length == 0) {
        return res.status(204).send({ message: "no pets found" });
      }
      return res.status(200).send({ filteredPets: filteredPets });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  }
  return res.status(404).send({ message: "filter not found" });
};

//Function to get pet stats to display for admin
const petStats = async (req, res) => {
  try {
    const pets = await Pet.find();
    const posts = await Post.find();
    const stats = {
      totalNumberOfAdoptedPets: 0,
      totalNumberOfAvailablePets: 0,
      totalNumberOfLostPets: 0,
      totalNumberOfFoundPets: 0,
      totalNumberOfPetsByType: {},
    };

    pets.forEach((pet) => {
      if (pet.status === "ADOPTED") {
        stats.totalNumberOfAdoptedPets++;
      } else if (pet.status === "AVAILABLE") {
        stats.totalNumberOfAvailablePets++;
      }

      if (stats.totalNumberOfPetsByType[pet.type]) {
        stats.totalNumberOfPetsByType[pet.type]++;
      } else {
        stats.totalNumberOfPetsByType[pet.type] = 1;
      }
    });
    posts.forEach((post) => {
      if (post.type === "LOST") {
        stats.totalNumberOfLostPets++;
      } else if (post.type === "FOUND") {
        stats.totalNumberOfFoundPets++;
      }
    });

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

module.exports = {
  addPet,
  editPet,
  getAllPets,
  getPet,
  deletePet,
  filterPet,
  petStats,
};
