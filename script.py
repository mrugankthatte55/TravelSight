import pandas as pd

# Load the data
df = pd.read_csv('sentiment_matrix_data_2020.csv')

# Function to normalize using min-max scaling and round to 2 decimal places
def min_max_normalize(column):
    normalized = (column - column.min()) / (column.max() - column.min())
    return round(normalized, 2)

# Identify numerical columns to normalize
numeric_columns = ['PositiveSentiment', 'NegativeSentiment', 
                  'PositiveCount', 'NegativeCount', 
                  'TotalCount', 'NonEmotionalCount']

# Create a new dataframe with normalized values
normalized_df = df.copy()
for column in numeric_columns:
    normalized_df[column] = min_max_normalize(df[column])

# Display first few rows of normalized data
print("Normalized Data:")
print(normalized_df.head())

# Save the normalized data to a new CSV file
normalized_df.to_csv('normalized_sentiment_data_2020.csv', index=False)