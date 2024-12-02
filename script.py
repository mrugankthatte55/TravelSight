import csv
import random

theme_words = {
    "Foods": [
        ("delicious", 60), ("cuisine", 55), ("restaurant", 50), ("cafe", 48), ("taste", 45),
        ("fresh", 43), ("menu", 40), ("flavor", 38), ("local", 35), ("traditional", 33),
        ("authentic", 30), ("gourmet", 28), ("specialty", 25), ("snack", 23), ("dessert", 20),
        ("breakfast", 18), ("lunch", 15), ("dinner", 13), ("buffet", 10), ("organic", 8),
        ("sweet", 45), ("savory", 42), ("spicy", 40), ("quality", 38), ("portion", 35),
        ("price", 33), ("variety", 30), ("seasonal", 28), ("ingredients", 25), ("dining", 23),
        ("foodcourt", 20), ("chef", 18), ("culinary", 15), ("appetizer", 13), ("beverage", 10),
        ("homemade", 40), ("famous", 38), ("signature", 35), ("fusion", 33), ("street_food", 30)
    ],
    
    "Atmospheres": [
        ("ambiance", 60), ("peaceful", 55), ("quiet", 50), ("crowded", 48), ("lively", 45),
        ("relaxing", 43), ("cozy", 40), ("elegant", 38), ("modern", 35), ("historic", 33),
        ("romantic", 30), ("bustling", 28), ("serene", 25), ("vibrant", 23), ("intimate", 20),
        ("welcoming", 18), ("friendly", 15), ("warm", 13), ("sophisticated", 10), ("charming", 8),
        ("atmosphere", 45), ("mood", 42), ("vibe", 40), ("environment", 38), ("setting", 35),
        ("ambience", 33), ("character", 30), ("energy", 28), ("feeling", 25), ("aura", 23),
        ("spacious", 20), ("comfortable", 18), ("luxurious", 15), ("traditional", 13), ("authentic", 10)
    ],
    
    "Services": [
        ("staff", 60), ("helpful", 55), ("friendly", 50), ("professional", 48), ("efficient", 45),
        ("attentive", 43), ("courteous", 40), ("knowledgeable", 38), ("service", 35), ("guide", 33),
        ("information", 30), ("assistance", 28), ("booking", 25), ("reservation", 23), ("facility", 20),
        ("amenity", 18), ("convenience", 15), ("accommodation", 13), ("management", 10), ("hospitality", 8),
        ("reception", 45), ("tour", 42), ("instruction", 40), ("support", 38), ("maintenance", 35),
        ("cleanliness", 33), ("security", 30), ("accessibility", 28), ("availability", 25), ("promptness", 23)
    ],
    
    "Scenery": [
        ("beautiful", 60), ("stunning", 55), ("spectacular", 50), ("picturesque", 48), ("scenic", 45),
        ("view", 43), ("landscape", 40), ("panorama", 38), ("vista", 35), ("natural", 33),
        ("sunset", 30), ("sunrise", 28), ("mountain", 25), ("ocean", 23), ("garden", 20),
        ("architecture", 18), ("skyline", 15), ("horizon", 13), ("dramatic", 10), ("photogenic", 8),
        ("impressive", 45), ("magnificent", 42), ("majestic", 40), ("breathtaking", 38), ("perspective", 35),
        ("overlook", 33), ("scenery", 30), ("outlook", 28), ("panoramic", 25), ("viewpoint", 23)
    ],
    
    "Attractions": [
        ("famous", 60), ("popular", 55), ("historic", 50), ("iconic", 48), ("unique", 45),
        ("landmark", 43), ("exhibition", 40), ("display", 38), ("gallery", 35), ("collection", 33),
        ("artifact", 30), ("artwork", 28), ("monument", 25), ("statue", 23), ("fountain", 20),
        ("architecture", 18), ("design", 15), ("structure", 13), ("feature", 10), ("highlight", 8),
        ("masterpiece", 45), ("treasure", 42), ("exhibition", 40), ("showcase", 38), ("permanent", 35),
        ("temporary", 33), ("interactive", 30), ("educational", 28), ("cultural", 25), ("historical", 23),
        ("significant", 20), ("remarkable", 18), ("impressive", 15), ("renowned", 13), ("prominent", 10)
    ]
}

# Generate CSV data
filename = "location_theme_words.csv"
locations = [
    "Louvre", "British Museum", "Smithsonian", "Rijksmuseum", "Metropolitan Museum",
    "Vatican City", "Mecca", "Golden Temple", "Angkor Wat", "Notre Dame",
    "Central Park", "Hyde Park", "Golden Gate Park", "Yoyogi Park", "Ueno Park",
    "Kyoto", "Pompeii", "Luang Prabang", "Bhaktapur"
]

with open(filename, 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Location", "Theme", "Word", "Frequency", "Sentiment", "Month"])
    
    for location in locations:
        for theme, words in theme_words.items():
            for word, base_weight in words:
                for month in range(1, 13):
                    # Add some random variation to the base weight
                    frequency = base_weight + random.randint(-10, 10)
                    sentiment = round(random.uniform(-1, 1), 2)
                    
                    # Generate multiple variations for high-frequency words
                    variations = max(1, base_weight // 20)
                    for _ in range(variations):
                        freq_variation = frequency + random.randint(-5, 5)
                        if freq_variation > 0:
                            writer.writerow([
                                location,
                                theme,
                                word,
                                freq_variation,
                                sentiment,
                                f"2020-{month:02d}"
                            ])

print("CSV file has been generated with location theme word frequencies.")