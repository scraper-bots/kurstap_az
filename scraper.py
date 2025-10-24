import requests
from bs4 import BeautifulSoup
import csv
import json
import time
import re
from typing import List, Dict, Optional

class KurstapScraper:
    def __init__(self):
        self.base_url = "https://www.kurstap.az"
        self.listings_url = f"{self.base_url}/kateqoriyalar"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.courses_data = []

    def get_total_pages(self) -> int:
        """Determine total number of pages by trying to fetch pages until we get no results"""
        print("Determining total number of pages...")
        offset = 0
        max_per_page = 8

        while True:
            params = {
                'c': '',
                'index': 'index',
                'vip': '',
                'city': '',
                'underground': '',
                'search': '',
                'company': '',
                'category': '',
                'subCategory': '',
                'subCatTitle': '',
                'title': '',
                'offset': offset,
                'max': max_per_page
            }

            try:
                response = self.session.get(self.listings_url, params=params, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')

                # Check if there are any course listings on this page
                course_links = soup.select('a[href*="/kurslar/"]')
                if not course_links:
                    break

                offset += max_per_page
                time.sleep(0.5)  # Be respectful to the server

            except Exception as e:
                print(f"Error checking page at offset {offset}: {e}")
                break

        total_pages = offset // max_per_page
        print(f"Found approximately {total_pages} pages")
        return total_pages

    def get_course_links_from_page(self, offset: int = 0, max_per_page: int = 8) -> List[str]:
        """Extract all course links from a listings page"""
        params = {
            'c': '',
            'index': 'index',
            'vip': '',
            'city': '',
            'underground': '',
            'search': '',
            'company': '',
            'category': '',
            'subCategory': '',
            'subCatTitle': '',
            'title': '',
            'offset': offset,
            'max': max_per_page
        }

        try:
            print(f"Fetching listings page (offset={offset})...")
            response = self.session.get(self.listings_url, params=params, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all course links
            course_links = []
            for link in soup.select('a[href*="/kurslar/"]'):
                href = link.get('href')
                if href and '/kurslar/' in href:
                    full_url = f"{self.base_url}{href}" if href.startswith('/') else href
                    if full_url not in course_links:
                        course_links.append(full_url)

            print(f"Found {len(course_links)} course links on this page")
            return course_links

        except Exception as e:
            print(f"Error fetching listings page at offset {offset}: {e}")
            return []

    def extract_course_data(self, course_url: str) -> Optional[Dict]:
        """Extract all relevant data from a course page"""
        try:
            print(f"Scraping course: {course_url}")
            response = self.session.get(course_url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            course_data = {
                'url': course_url,
                'course_id': course_url.split('/kurslar/')[-1].split('/')[0] if '/kurslar/' in course_url else '',
            }

            # Extract from the course-top-part section
            course_section = soup.select_one('section.course-top-part')
            if not course_section:
                print(f"Warning: Could not find course-top-part section on {course_url}")
                return None

            # Company/Institution name
            main_name = course_section.select_one('a.main-name span:last-child')
            course_data['institution_name'] = main_name.get_text(strip=True) if main_name else ''

            # Course title
            title_desc = course_section.select_one('.title-desc')
            course_data['course_title'] = title_desc.get_text(strip=True) if title_desc else ''

            # Course duration
            duration_elem = course_section.find('span', string=re.compile('Kurs müddəti'))
            if duration_elem:
                duration_p = duration_elem.find_next('p')
                course_data['duration'] = duration_p.get_text(strip=True) if duration_p else ''
            else:
                course_data['duration'] = ''

            # Course price (Fərdi hazırlıq)
            price_elem = course_section.find('span', string=re.compile('Fərdi hazırlıq'))
            if price_elem:
                price_p = price_elem.find_next('p')
                course_data['price'] = price_p.get_text(strip=True) if price_p else ''
            else:
                course_data['price'] = ''

            # City and District
            city_elem = course_section.find('span', string=re.compile('Şəhər, Rayon'))
            if city_elem:
                city_p = city_elem.find_next('p')
                course_data['location'] = city_p.get_text(strip=True).replace('\n', ', ') if city_p else ''
            else:
                course_data['location'] = ''

            # Contact information (phone numbers and email)
            contact_elem = course_section.find('span', string=re.compile('Əlaqə'))
            phone_numbers = []
            emails = []

            if contact_elem:
                contact_ul = contact_elem.find_next('ul')
                if contact_ul:
                    for li in contact_ul.find_all('li'):
                        text = li.get_text(strip=True)
                        # Check if it's a phone number
                        if '+994' in text or any(char.isdigit() for char in text):
                            # Clean up phone number
                            phone = text.replace('\n', '').strip()
                            if phone:
                                phone_numbers.append(phone)
                        # Check if it's an email
                        elif '@' in text:
                            emails.append(text)

            course_data['phone_numbers'] = ' | '.join(phone_numbers) if phone_numbers else ''
            course_data['emails'] = ' | '.join(emails) if emails else ''

            # Address
            address_elem = course_section.find('span', string=re.compile('Ünvan'))
            if address_elem:
                address_p = address_elem.find_next('p')
                course_data['address'] = address_p.get_text(strip=True) if address_p else ''
            else:
                course_data['address'] = ''

            # Social media / Website
            social_elem = course_section.find('span', string=re.compile('Sosial media'))
            website = ''
            if social_elem:
                social_ul = social_elem.find_next('ul')
                if social_ul:
                    link = social_ul.find('a')
                    if link:
                        website = link.get_text(strip=True)
            course_data['website'] = website

            return course_data

        except Exception as e:
            print(f"Error extracting data from {course_url}: {e}")
            return None

    def scrape_all_courses(self):
        """Main method to scrape all courses from all pages"""
        print("Starting scrape...")

        offset = 0
        max_per_page = 8
        all_course_urls = set()

        # Collect all course URLs from all pages
        while True:
            course_links = self.get_course_links_from_page(offset, max_per_page)

            if not course_links:
                print(f"No more courses found at offset {offset}. Stopping pagination.")
                break

            all_course_urls.update(course_links)
            offset += max_per_page
            time.sleep(1)  # Be respectful to the server

        print(f"\nTotal unique course URLs found: {len(all_course_urls)}")
        print("\nStarting to scrape individual course pages...")

        # Scrape each course page
        for idx, course_url in enumerate(all_course_urls, 1):
            print(f"\nProgress: {idx}/{len(all_course_urls)}")
            course_data = self.extract_course_data(course_url)

            if course_data:
                self.courses_data.append(course_data)
                print(f"✓ Successfully scraped: {course_data.get('course_title', 'Unknown')}")

            time.sleep(1)  # Be respectful to the server

        print(f"\n{'='*50}")
        print(f"Scraping complete! Total courses scraped: {len(self.courses_data)}")
        print(f"{'='*50}")

    def save_to_csv(self, filename: str = 'kurstap_courses.csv'):
        """Save scraped data to CSV file"""
        if not self.courses_data:
            print("No data to save!")
            return

        keys = self.courses_data[0].keys()

        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(self.courses_data)

        print(f"Data saved to {filename}")

    def save_to_json(self, filename: str = 'kurstap_courses.json'):
        """Save scraped data to JSON file"""
        if not self.courses_data:
            print("No data to save!")
            return

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.courses_data, f, ensure_ascii=False, indent=2)

        print(f"Data saved to {filename}")


def main():
    scraper = KurstapScraper()

    # Scrape all courses
    scraper.scrape_all_courses()

    # Save to both CSV and JSON
    scraper.save_to_csv('kurstap_courses.csv')
    scraper.save_to_json('kurstap_courses.json')

    # Print summary
    if scraper.courses_data:
        print(f"\nSample of first course:")
        print(json.dumps(scraper.courses_data[0], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
