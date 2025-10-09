from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Give the page a moment to load and potentially crash
        page.wait_for_timeout(1000)

        # Check for the heading
        expect(page.get_by_role("heading", name="Division Report Tracker")).to_be_visible()

        page.get_by_placeholder("Email address").fill("admin@test.com")
        page.get_by_role("button", name="Continue").click()

        expect(page.get_by_text("Account not registered. Please contact an administrator.")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Verification script ran successfully.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # If an error occurs, print the page content to help debug
        print("\nPage HTML:\n")
        print(page.content())

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)