import csv
import random

# Keep the previous locations and categories definitions
locations = [
    "British Museum", "Getty Center", "Guggenheim", "Hermitage", "Louvre",
    "Metropolitan Museum", "National Gallery", "Rijksmuseum", "Smithsonian", "Uffizi Gallery",
    "Angkor Wat", "Golden Temple", "Mecca", "Notre Dame", "Sagrada Familia",
    "Salt Lake Temple", "Shwedagon Pagoda", "St. Peter's Basilica", "Vatican City", "Western Wall",
    "Balboa Park", "Central Park", "Chapultepec Park", "Golden Gate Park", "Griffith Park",
    "Hyde Park", "Mount Royal Park", "Prospect Park", "Ueno Park", "Yoyogi Park",
    "Bhaktapur", "Giza", "Hoi An", "Kyoto", "Luang Prabang",
    "Machu Picchu", "Petra", "Pompeii", "Tikal", "Timbuktu",
    "Amazon Rainforest", "Banff National Park", "Everglades", "Galapagos Islands", "Great Barrier Reef",
    "Kruger National Park", "Serengeti", "Sundarbans", "Yellowstone", "Yosemite"
]

# Modified word associations with base frequency ranges for each type
word_associations = {
    "foods": {
        "museum": [("café", 80, 120), ("restaurant", 70, 100), ("snacks", 50, 80), 
                  ("coffee", 60, 90), ("pastries", 30, 50), ("sandwiches", 40, 70)],
        "religious": [("offerings", 70, 100), ("vegetarian", 50, 80), ("traditional", 60, 90), 
                     ("kosher", 40, 70), ("halal", 45, 75), ("sacred", 30, 60)],
        "park": [("picnic", 90, 130), ("food trucks", 60, 90), ("ice cream", 70, 100), 
                ("hot dogs", 50, 80), ("vendors", 40, 70), ("refreshments", 30, 60)],
        "historical": [("local cuisine", 80, 120), ("street food", 70, 100), ("authentic", 60, 90), 
                      ("traditional", 50, 80), ("spices", 40, 70), ("fresh", 30, 60)],
        "nature": [("packed lunch", 70, 100), ("camping food", 60, 90), ("local dishes", 50, 80), 
                  ("fresh fish", 40, 70), ("fruits", 30, 60), ("organic", 25, 55)]
    },
    "atmospheres": {
        "museum": [("quiet", 90, 130), ("peaceful", 80, 120), ("cultured", 70, 100), 
                  ("elegant", 60, 90), ("refined", 50, 80), ("intellectual", 40, 70)],
        "religious": [("spiritual", 100, 150), ("serene", 90, 130), ("reverent", 80, 120), 
                     ("sacred", 70, 100), ("peaceful", 60, 90), ("mystical", 50, 80)],
        "park": [("relaxed", 90, 130), ("lively", 80, 120), ("family-friendly", 70, 100), 
                ("outdoor", 60, 90), ("natural", 50, 80), ("recreational", 40, 70)],
        "historical": [("ancient", 100, 150), ("mysterious", 80, 120), ("authentic", 70, 100), 
                      ("timeless", 60, 90), ("cultural", 50, 80), ("historic", 40, 70)],
        "nature": [("pristine", 90, 130), ("wild", 80, 120), ("tranquil", 70, 100), 
                  ("untamed", 60, 90), ("natural", 50, 80), ("serene", 40, 70)]
    },
    "services": {
        "museum": [("guided tours", 100, 150), ("audio guides", 80, 120), ("information desk", 70, 100), 
                  ("gift shop", 60, 90), ("coat check", 50, 80), ("wheelchair access", 40, 70)],
        "religious": [("guided tours", 90, 130), ("prayer rooms", 80, 120), ("visitor center", 70, 100), 
                     ("dress code", 60, 90), ("information", 50, 80), ("facilities", 40, 70)],
        "park": [("restrooms", 90, 130), ("visitor center", 80, 120), ("rentals", 70, 100), 
                ("parking", 60, 90), ("security", 50, 80), ("maintenance", 40, 70)],
        "historical": [("guided tours", 100, 150), ("information center", 80, 120), ("maps", 70, 100), 
                      ("restrooms", 60, 90), ("security", 50, 80), ("transportation", 40, 70)],
        "nature": [("rangers", 90, 130), ("visitor center", 80, 120), ("guided tours", 70, 100), 
                  ("camping", 60, 90), ("boat rental", 50, 80), ("shuttle", 40, 70)]
    },
    "scenery": {
        "museum": [("galleries", 100, 150), ("architecture", 90, 130), ("halls", 80, 120), 
                  ("exhibits", 70, 100), ("lighting", 60, 90), ("space", 50, 80)],
        "religious": [("architecture", 100, 150), ("gardens", 90, 130), ("domes", 80, 120), 
                     ("towers", 70, 100), ("sculptures", 60, 90), ("decorations", 50, 80)],
        "park": [("trees", 100, 150), ("gardens", 90, 130), ("lakes", 80, 120), 
                ("paths", 70, 100), ("landscapes", 60, 90), ("fountains", 50, 80)],
        "historical": [("ruins", 100, 150), ("architecture", 90, 130), ("stones", 80, 120), 
                      ("artifacts", 70, 100), ("monuments", 60, 90), ("structures", 50, 80)],
        "nature": [("landscapes", 100, 150), ("wildlife", 90, 130), ("vegetation", 80, 120), 
                  ("waters", 70, 100), ("mountains", 60, 90), ("forests", 50, 80)]
    },
    "attractions": {
        "museum": [("exhibitions", 100, 150), ("artifacts", 90, 130), ("masterpieces", 80, 120), 
                  ("collections", 70, 100), ("galleries", 60, 90), ("artwork", 50, 80)],
        "religious": [("ceremonies", 100, 150), ("rituals", 90, 130), ("architecture", 80, 120), 
                     ("history", 70, 100), ("art", 60, 90), ("worship", 50, 80)],
        "park": [("playgrounds", 100, 150), ("sports", 90, 130), ("events", 80, 120), 
                ("activities", 70, 100), ("attractions", 60, 90), ("recreation", 50, 80)],
        "historical": [("archaeology", 100, 150), ("history", 90, 130), ("culture", 80, 120), 
                      ("architecture", 70, 100), ("artifacts", 60, 90), ("ruins", 50, 80)],
        "nature": [("wildlife", 100, 150), ("hiking", 90, 130), ("scenery", 80, 120), 
                  ("adventures", 70, 100), ("ecology", 60, 90), ("experiences", 50, 80)]
    }
}

# Keep the location types dictionary and get_location_type function
location_types = {
    "museum": ["British Museum", "Getty Center", "Guggenheim", "Hermitage", "Louvre", 
               "Metropolitan Museum", "National Gallery", "Rijksmuseum", "Smithsonian", "Uffizi Gallery"],
    "religious": ["Angkor Wat", "Golden Temple", "Mecca", "Notre Dame", "Sagrada Familia",
                 "Salt Lake Temple", "Shwedagon Pagoda", "St. Peter's Basilica", "Vatican City", "Western Wall"],
    "park": ["Balboa Park", "Central Park", "Chapultepec Park", "Golden Gate Park", "Griffith Park",
             "Hyde Park", "Mount Royal Park", "Prospect Park", "Ueno Park", "Yoyogi Park"],
    "historical": ["Bhaktapur", "Giza", "Hoi An", "Kyoto", "Luang Prabang",
                  "Machu Picchu", "Petra", "Pompeii", "Tikal", "Timbuktu"],
    "nature": ["Amazon Rainforest", "Banff National Park", "Everglades", "Galapagos Islands", "Great Barrier Reef",
               "Kruger National Park", "Serengeti", "Sundarbans", "Yellowstone", "Yosemite"]
}

def get_location_type(location):
    for type_name, locations_list in location_types.items():
        if location in locations_list:
            return type_name
    return None

# Create CSV file with frequency data
with open('location_words_frequency.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Location', 'Category', 'Word', 'Frequency'])
    
    for location in locations:
        loc_type = get_location_type(location)
        
        # Add entries for each category
        for category, word_data in word_associations.items():
            for word, min_freq, max_freq in word_data[loc_type]:
                # Generate a realistic frequency based on the location's popularity
                frequency = random.randint(min_freq, max_freq)
                writer.writerow([location, category, word, frequency])

print("CSV file has been created successfully!")