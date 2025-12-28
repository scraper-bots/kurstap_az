"""
Business Analytics Chart Generation for Kurstap Course Market Analysis
Generates comprehensive visualizations focused on business insights and decision-making
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import re
from pathlib import Path

# Configure visualization style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (12, 7)
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 11

# Create charts directory
CHARTS_DIR = Path('charts')
CHARTS_DIR.mkdir(exist_ok=True)

# Load data
df = pd.read_excel('kurstap_courses.xlsx')

print("=" * 80)
print("GENERATING BUSINESS ANALYTICS CHARTS")
print("=" * 80)
print(f"Total Records: {len(df)}")
print(f"Analysis Period: Current Market Snapshot")
print("=" * 80 + "\n")


def clean_price(price_str):
    """Extract numeric price from price string"""
    if pd.isna(price_str):
        return np.nan
    price_str = str(price_str)
    numbers = re.findall(r'\d+', price_str)
    return int(numbers[0]) if numbers else np.nan


def categorize_course(title):
    """Categorize courses into business-relevant categories"""
    if pd.isna(title):
        return 'Other'
    title = str(title).lower()

    if any(word in title for word in ['ingilis', 'english', 'rus', 'russian', 'alman', 'german', 'dil', 'language', 'ielts', 'toefl']):
        return 'Language Training'
    elif any(word in title for word in ['kompüter', 'computer', 'programming', 'proqramlaşdırma', 'python', 'java', 'web', 'dizayn', 'design', 'grafik']):
        return 'IT & Technology'
    elif any(word in title for word in ['abituriyent', 'məktəb', 'buraxılış', 'imtahan', 'sınaq', 'dərs', 'repetitor']):
        return 'Academic Preparation'
    elif any(word in title for word in ['biznes', 'business', 'menecment', 'management', 'mühasibat', 'accounting', 'marketing']):
        return 'Business & Professional'
    elif any(word in title for word in ['uşaq', 'körpə', 'children', 'kids']):
        return 'Children Education'
    else:
        return 'Other'


# Process data
df['price_numeric'] = df['price'].apply(clean_price)
df['course_category'] = df['course_title'].apply(categorize_course)
df['district'] = df['location'].str.replace('Bakı', '').str.strip()
df['district'] = df['district'].replace('', 'Bakı Center')


# ===========================================================================================
# CHART 1: Market Share - Top 15 Training Providers by Course Offerings
# ===========================================================================================
print("[1/10] Generating Market Share Analysis...")

top_institutions = df['institution_name'].value_counts().head(15)

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.barh(range(len(top_institutions)), top_institutions.values, color='#2E86AB')
ax.set_yticks(range(len(top_institutions)))
ax.set_yticklabels(top_institutions.index, fontsize=10)
ax.set_xlabel('Number of Course Offerings', fontsize=12, fontweight='bold')
ax.set_title('Market Leaders: Top 15 Training Providers by Course Portfolio Size',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels
for i, (idx, value) in enumerate(top_institutions.items()):
    ax.text(value + 1, i, f'{value}', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '01_market_share_top_providers.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 2: Geographic Market Distribution
# ===========================================================================================
print("[2/10] Generating Geographic Distribution Analysis...")

location_dist = df['location'].value_counts().head(12)

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.bar(range(len(location_dist)), location_dist.values, color='#A23B72')
ax.set_xticks(range(len(location_dist)))
ax.set_xticklabels(location_dist.index, rotation=45, ha='right', fontsize=10)
ax.set_ylabel('Number of Course Offerings', fontsize=12, fontweight='bold')
ax.set_title('Geographic Market Concentration: Course Distribution by Location',
             fontsize=15, fontweight='bold', pad=20)

# Add value labels
for i, value in enumerate(location_dist.values):
    ax.text(i, value + 10, f'{value}', ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '02_geographic_distribution.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 3: Course Duration Preferences
# ===========================================================================================
print("[3/10] Generating Course Duration Analysis...")

duration_dist = df['duration'].value_counts().head(10)

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.barh(range(len(duration_dist)), duration_dist.values, color='#F18F01')
ax.set_yticks(range(len(duration_dist)))
ax.set_yticklabels(duration_dist.index, fontsize=11)
ax.set_xlabel('Number of Courses', fontsize=12, fontweight='bold')
ax.set_title('Course Duration Trends: Market Preference by Program Length',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels and percentages
total_courses = duration_dist.sum()
for i, (duration, value) in enumerate(duration_dist.items()):
    percentage = (value / total_courses) * 100
    ax.text(value + 5, i, f'{value} ({percentage:.1f}%)', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '03_duration_preferences.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 4: Price Point Distribution
# ===========================================================================================
print("[4/10] Generating Pricing Strategy Analysis...")

# Filter out NaN and focus on monthly prices
price_data = df[df['price'].notna() & df['price'].str.contains('Aylıq', na=False)].copy()
price_data['price_numeric'] = price_data['price'].apply(clean_price)
price_bins = [0, 60, 100, 150, 200, 300, 1000]
price_labels = ['<60 AZN', '60-100 AZN', '100-150 AZN', '150-200 AZN', '200-300 AZN', '>300 AZN']
price_data['price_range'] = pd.cut(price_data['price_numeric'], bins=price_bins, labels=price_labels)

price_distribution = price_data['price_range'].value_counts().sort_index()

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.bar(range(len(price_distribution)), price_distribution.values, color='#06A77D')
ax.set_xticks(range(len(price_distribution)))
ax.set_xticklabels(price_distribution.index, fontsize=11)
ax.set_ylabel('Number of Courses', fontsize=12, fontweight='bold')
ax.set_title('Pricing Strategy Landscape: Monthly Course Fee Distribution',
             fontsize=15, fontweight='bold', pad=20)

# Add value labels
for i, value in enumerate(price_distribution.values):
    ax.text(i, value + 2, f'{value}', ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '04_pricing_distribution.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 5: Course Category Market Breakdown
# ===========================================================================================
print("[5/10] Generating Course Category Analysis...")

category_dist = df['course_category'].value_counts()

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.barh(range(len(category_dist)), category_dist.values, color='#C73E1D')
ax.set_yticks(range(len(category_dist)))
ax.set_yticklabels(category_dist.index, fontsize=11)
ax.set_xlabel('Number of Courses', fontsize=12, fontweight='bold')
ax.set_title('Market Segmentation: Course Offerings by Category',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels and percentages
total_courses = len(df)
for i, (category, value) in enumerate(category_dist.items()):
    percentage = (value / total_courses) * 100
    ax.text(value + 15, i, f'{value} ({percentage:.1f}%)', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '05_course_categories.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 6: Market Concentration Analysis
# ===========================================================================================
print("[6/10] Generating Market Concentration Analysis...")

# Calculate market share percentages
total_courses = len(df)
institution_counts = df['institution_name'].value_counts()
top_5_share = institution_counts.head(5).sum() / total_courses * 100
top_10_share = institution_counts.head(10).sum() / total_courses * 100
top_20_share = institution_counts.head(20).sum() / total_courses * 100
others_share = 100 - top_20_share

concentration_data = {
    'Top 5 Providers': top_5_share,
    'Next 5 (6-10)': top_10_share - top_5_share,
    'Next 10 (11-20)': top_20_share - top_10_share,
    'Others (200+ providers)': others_share
}

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.bar(range(len(concentration_data)), concentration_data.values(),
              color=['#D62828', '#F77F00', '#FCBF49', '#90A955'])
ax.set_xticks(range(len(concentration_data)))
ax.set_xticklabels(concentration_data.keys(), fontsize=11)
ax.set_ylabel('Market Share (%)', fontsize=12, fontweight='bold')
ax.set_title('Market Concentration: How Fragmented is the Training Market?',
             fontsize=15, fontweight='bold', pad=20)

# Add value labels
for i, (label, value) in enumerate(concentration_data.items()):
    ax.text(i, value + 1, f'{value:.1f}%', ha='center', fontweight='bold', fontsize=11)

plt.tight_layout()
plt.savefig(CHARTS_DIR / '06_market_concentration.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 7: Average Price by Course Category
# ===========================================================================================
print("[7/10] Generating Price Comparison by Category...")

category_price = df[df['price_numeric'].notna()].groupby('course_category')['price_numeric'].agg(['mean', 'count'])
category_price = category_price[category_price['count'] >= 10].sort_values('mean', ascending=True)

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.barh(range(len(category_price)), category_price['mean'].values, color='#4361EE')
ax.set_yticks(range(len(category_price)))
ax.set_yticklabels(category_price.index, fontsize=11)
ax.set_xlabel('Average Monthly Price (AZN)', fontsize=12, fontweight='bold')
ax.set_title('Pricing Intelligence: Average Course Fees by Category',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels
for i, (category, row) in enumerate(category_price.iterrows()):
    ax.text(row['mean'] + 3, i, f'{row["mean"]:.0f} AZN', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '07_avg_price_by_category.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 8: District-Level Market Penetration (Bakı Only)
# ===========================================================================================
print("[8/10] Generating District-Level Analysis...")

baku_df = df[df['location'].str.contains('Bakı', na=False)]
district_dist = baku_df['district'].value_counts().head(10)

fig, ax = plt.subplots(figsize=(14, 8))
bars = ax.barh(range(len(district_dist)), district_dist.values, color='#7209B7')
ax.set_yticks(range(len(district_dist)))
ax.set_yticklabels(district_dist.index, fontsize=11)
ax.set_xlabel('Number of Courses', fontsize=12, fontweight='bold')
ax.set_title('Bakı Market Breakdown: Course Distribution by District',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels
for i, value in enumerate(district_dist.values):
    ax.text(value + 10, i, f'{value}', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig(CHARTS_DIR / '08_district_distribution.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 9: Provider Portfolio Diversity
# ===========================================================================================
print("[9/10] Generating Portfolio Diversity Analysis...")

# Calculate how many different categories each top institution offers
top_20_institutions = df['institution_name'].value_counts().head(20).index
diversity_data = []

for institution in top_20_institutions:
    inst_df = df[df['institution_name'] == institution]
    num_categories = inst_df['course_category'].nunique()
    total_courses = len(inst_df)
    diversity_data.append({
        'Institution': institution,
        'Categories': num_categories,
        'Total Courses': total_courses
    })

diversity_df = pd.DataFrame(diversity_data).sort_values('Categories', ascending=True)

fig, ax = plt.subplots(figsize=(14, 10))
bars = ax.barh(range(len(diversity_df)), diversity_df['Categories'].values, color='#F72585')
ax.set_yticks(range(len(diversity_df)))
ax.set_yticklabels(diversity_df['Institution'].values, fontsize=9)
ax.set_xlabel('Number of Course Categories Offered', fontsize=12, fontweight='bold')
ax.set_title('Strategic Portfolio Analysis: Category Diversity of Top 20 Providers',
             fontsize=15, fontweight='bold', pad=20)
ax.invert_yaxis()

# Add value labels
for i, row in enumerate(diversity_df.itertuples()):
    ax.text(row.Categories + 0.1, i, f'{row.Categories} categories', va='center', fontweight='bold', fontsize=9)

plt.tight_layout()
plt.savefig(CHARTS_DIR / '09_portfolio_diversity.png', dpi=300, bbox_inches='tight')
plt.close()


# ===========================================================================================
# CHART 10: Duration vs Price Correlation
# ===========================================================================================
print("[10/10] Generating Duration-Price Relationship Analysis...")

# Map duration to months
duration_mapping = {
    '1 ay': 1, '2 ay': 2, '3 ay': 3, '4 ay': 4, '5 ay': 5, '6 ay': 6,
    '7 ay': 7, '8 ay': 8, '9 ay': 9, '10 ay': 10, '11 ay': 11, '12 ay': 12,
    '1 il': 12
}

duration_price_df = df[df['price_numeric'].notna() & df['duration'].notna()].copy()
duration_price_df['duration_months'] = duration_price_df['duration'].map(duration_mapping)
duration_price_df = duration_price_df[duration_price_df['duration_months'].notna()]

# Group by duration and calculate average price
duration_avg_price = duration_price_df.groupby('duration_months')['price_numeric'].agg(['mean', 'count'])
duration_avg_price = duration_avg_price[duration_avg_price['count'] >= 5].sort_index()

fig, ax = plt.subplots(figsize=(14, 8))
ax.plot(duration_avg_price.index, duration_avg_price['mean'].values,
        marker='o', linewidth=3, markersize=10, color='#06A77D')
ax.set_xlabel('Course Duration (Months)', fontsize=12, fontweight='bold')
ax.set_ylabel('Average Monthly Price (AZN)', fontsize=12, fontweight='bold')
ax.set_title('Pricing Strategy Insights: Price vs. Duration Relationship',
             fontsize=15, fontweight='bold', pad=20)
ax.grid(True, alpha=0.3)

# Add value labels
for x, y in zip(duration_avg_price.index, duration_avg_price['mean'].values):
    ax.text(x, y + 5, f'{y:.0f} AZN', ha='center', fontweight='bold', fontsize=9)

plt.tight_layout()
plt.savefig(CHARTS_DIR / '10_duration_price_relationship.png', dpi=300, bbox_inches='tight')
plt.close()


print("\n" + "=" * 80)
print("CHART GENERATION COMPLETE!")
print("=" * 80)
print(f"All charts saved to: {CHARTS_DIR.absolute()}")
print("\nGenerated Charts:")
print("  1. Market Share - Top 15 Providers")
print("  2. Geographic Distribution")
print("  3. Course Duration Preferences")
print("  4. Pricing Distribution")
print("  5. Course Category Breakdown")
print("  6. Market Concentration Analysis")
print("  7. Average Price by Category")
print("  8. Bakı District Distribution")
print("  9. Provider Portfolio Diversity")
print(" 10. Duration-Price Relationship")
print("=" * 80)
