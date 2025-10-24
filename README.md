# Kurstap.az Course Scraper

A Python web scraper to extract course information from kurstap.az, including phone numbers, course details, pricing, and contact information.

## Features

- Scrapes all course listings from kurstap.az
- Handles pagination automatically
- Extracts comprehensive course data:
  - Institution name
  - Course title
  - Duration
  - Price
  - Location (city and district)
  - Phone numbers
  - Email addresses
  - Physical address
  - Website/social media links
- Exports data to both CSV and JSON formats
- Rate limiting to be respectful to the server

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the scraper:

```bash
python scraper.py
```

The scraper will:
1. Automatically discover all course listing pages
2. Extract course URLs from each page
3. Visit each course page and extract detailed information
4. Save the data to two files:
   - `kurstap_courses.csv` - CSV format for spreadsheet applications
   - `kurstap_courses.json` - JSON format for further processing

## Output Format

The scraper extracts the following fields for each course:

- `url` - Direct link to the course page
- `course_id` - Unique course identifier
- `institution_name` - Name of the educational institution
- `course_title` - Title of the course
- `duration` - Course duration (e.g., "3 ay")
- `price` - Course price (e.g., "Aylıq 150 AZN")
- `location` - City and district
- `phone_numbers` - Contact phone numbers (multiple separated by |)
- `emails` - Contact email addresses (multiple separated by |)
- `address` - Physical address
- `website` - Website or social media link

## Example Output

```json
{
  "url": "https://www.kurstap.az/kurslar/1701/kosmetologiya-kursu",
  "course_id": "1701",
  "institution_name": "HOME EDUCATİON",
  "course_title": "Kosmetologiya kursu",
  "duration": "3 ay",
  "price": "Aylıq 150 AZN",
  "location": "Bakı, Səbail",
  "phone_numbers": "+994 12 498 03 02",
  "emails": "home.education@mail.ru",
  "address": "Xaqani küçəsi 36",
  "website": "https:\\\\ www.home-edu.az"
}
```

## Notes

- The scraper includes 1-second delays between requests to avoid overloading the server
- Progress is displayed during scraping
- Error handling is included for network issues and missing data
- Please use this tool responsibly and in accordance with the website's terms of service
