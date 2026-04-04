#!/usr/bin/env python3
"""Publish a job offer on hydros-alumni.org using Playwright."""

import time
from playwright.sync_api import sync_playwright

FORM_URL = "https://www.hydros-alumni.org/fr/jobboard/index/add"
COOKIE = {
    "name": "AFSESSID",
    "value": "7c607d8c098cffb2de1e1a65215281a9",
    "domain": "www.hydros-alumni.org",
    "path": "/",
}

DESCRIPTION = """Le département de la Seine-Maritime exploite 8 passages d'eau en Seine entre Rouen et Quillebeuf, avec 11 bacs et 3,3 millions de traversées véhicules/an. Recrute 2 techniciens navals électromécaniciens.

Missions : maintenance préventive et corrective des organes électriques et électroniques, réparations de transbordeurs rouliers à passagers, entretien des circuits hydrauliques, élaboration de bilans électriques et rapports techniques. Astreinte environ 1 semaine/mois (week-ends et jours fériés).

Profil : Bac Pro à Bac+2 électromécanique. Habilitations B2V/BR/BC/BTA – BS BE MAN B2+B0. Permis B obligatoire. CACES R389 CAT 3 et R423 appréciés. Expérience GMAO souhaitée.

Avantages : titres restaurant, forfait mobilités durables, plan de formation dynamique. Ouvert aux titulaires, lauréats de concours et contractuels."""


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="fr-FR",
        )
        context.add_cookies([COOKIE])
        page = context.new_page()

        # Step 1: Navigate to the form
        print("[1] Navigating to form...")
        page.goto(FORM_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path="/home/user/gaspe-fr/screenshots/step1_form_loaded.png", full_page=True)
        print(f"    Current URL: {page.url}")
        print(f"    Title: {page.title()}")

        # Check if we got redirected to login
        if "login" in page.url.lower() or "connexion" in page.url.lower():
            print("    → Redirected to login page, cookie may have expired.")
            print("    → Attempting login with credentials...")
            # Try to fill login form
            email_field = page.locator('input[type="email"], input[name="email"], input[name="login"], input[name="_username"]').first
            pass_field = page.locator('input[type="password"]').first
            if email_field.is_visible() and pass_field.is_visible():
                email_field.fill("colomban@gaspe.fr")
                pass_field.fill("psX2dWC^H^fm0I")
                page.screenshot(path="/home/user/gaspe-fr/screenshots/step1b_login_filled.png")
                # Submit
                submit = page.locator('button[type="submit"], input[type="submit"]').first
                submit.click()
                page.wait_for_timeout(3000)
                page.screenshot(path="/home/user/gaspe-fr/screenshots/step1c_after_login.png", full_page=True)
                print(f"    After login URL: {page.url}")
                # Navigate to form again
                page.goto(FORM_URL, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(2000)
                page.screenshot(path="/home/user/gaspe-fr/screenshots/step1d_form_after_login.png", full_page=True)

        # Dump the page HTML for inspection
        html = page.content()
        with open("/home/user/gaspe-fr/screenshots/form_page.html", "w") as f:
            f.write(html)
        print("    → Saved page HTML to screenshots/form_page.html")

        # Step 2: Inspect available form fields
        print("\n[2] Inspecting form fields...")
        inputs = page.locator("input, select, textarea").all()
        for inp in inputs:
            try:
                tag = inp.evaluate("el => el.tagName")
                name = inp.get_attribute("name") or ""
                typ = inp.get_attribute("type") or ""
                placeholder = inp.get_attribute("placeholder") or ""
                label_text = ""
                # Try to get associated label
                inp_id = inp.get_attribute("id")
                if inp_id:
                    label = page.locator(f'label[for="{inp_id}"]')
                    if label.count() > 0:
                        label_text = label.first.inner_text()
                print(f"    {tag} name={name} type={typ} placeholder={placeholder} label={label_text}")
            except Exception:
                pass

        # Also check for select options
        selects = page.locator("select").all()
        for sel in selects:
            name = sel.get_attribute("name") or ""
            options = sel.locator("option").all()
            opts_text = [o.inner_text().strip() for o in options[:10]]
            print(f"    SELECT name={name} options={opts_text}")

        print("\n    → Form fields inspection complete.")
        browser.close()


if __name__ == "__main__":
    import os
    os.makedirs("/home/user/gaspe-fr/screenshots", exist_ok=True)
    main()
