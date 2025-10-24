# Kurstap.az Course Scraper

A high-performance Python web scraper to extract course information from kurstap.az, including phone numbers, course details, pricing, and contact information.

## Features

- **Fast async scraping** using aiohttp and asyncio (20 concurrent requests)
- Scrapes all 1382+ course listings from kurstap.az
- Handles pagination automatically
- **Smart phone number extraction**: Creates separate rows for each phone number
  - Automatically detects and splits concatenated phone numbers
  - Each row contains one clean phone number
  - Handles both formats: `+994 XX XXX XX XX` and `+994XXXXXXXXX`
- Extracts comprehensive course data:
  - Institution name
  - Course title
  - Duration
  - Price
  - Location (city and district)
  - Phone numbers (one per row)
  - Email addresses
  - Physical address
  - Website/social media links
- Exports data to **CSV, JSON, and XLSX** formats
- Built-in rate limiting and error handling

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the high-performance async scraper:

```bash
python scraper_async.py
```

This scraper uses asyncio and aiohttp for concurrent scraping (20 requests at once) for maximum performance.

### What the scraper does:

1. Automatically discovers all course listing pages (pagination)
2. Extracts all unique course URLs
3. Visits each course page and extracts detailed information
4. Saves the data to three files:
   - `kurstap_courses.csv` - CSV format for spreadsheet applications
   - `kurstap_courses.json` - JSON format for further processing
   - `kurstap_courses.xlsx` - Excel format with formatting

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

## Performance

The async scraper can complete scraping of all 1382+ courses in approximately **10-15 minutes**.

## Output Data

Since the scraper creates a separate row for each phone number:
- **Original courses**: ~1382
- **Output rows**: ~1870+ (each course with multiple phone numbers gets multiple rows)
- Each row has one clean, individual phone number

## Notes

- The async scraper uses connection pooling and semaphores to limit concurrent requests (20 max)
- Progress is displayed in real-time during scraping
- Comprehensive error handling for network issues and missing data
- The XLSX export includes:
  - Formatted headers with color
  - Auto-adjusted column widths
  - Frozen header row for easy scrolling
- Please use this tool responsibly and in accordance with the website's terms of service

## Sample Data

After running the scraper, you'll have access to comprehensive data for 1382+ courses including:
- Full contact information (phone numbers, emails)
- Course details (duration, pricing)
- Institution information
- Location data
