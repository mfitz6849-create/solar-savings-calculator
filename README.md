# Solar Savings Calculator

A mobile-friendly Australian solar and battery lead-generation calculator for Mark Fitzpatrick.

## Features

- Home, business, commercial and farm assessments
- Grid-only, solar-only and solar-plus-battery scenarios
- Annual savings plus 10-year and 25-year net-benefit comparisons
- Solar size and battery capacity recommendations
- Five interactive charts, including current bill versus estimated savings
- 2026 federal STCs, state incentive prompts and postcode-based solar yield
- Plenti residential and Smart Ease commercial finance illustrations
- Personalised five-page PDF report with Mark's embedded photo
- Lead capture through the existing Google Apps Script endpoint
- Optional 30-minute telephone appointment request
- Google Calendar invitation with Mark added as the guest
- Optional energy bill upload when requesting an appointment
- Responsive design and privacy notice

## Publish free with GitHub Pages

1. Create a new public GitHub repository, for example `solar-savings-calculator`.
2. Upload every file and the `vendor` folder from this package to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then select **Save**.
6. GitHub will provide a public address similar to `https://yourusername.github.io/solar-savings-calculator/`.

The main calculator is static and does not require a paid GitHub server. The optional energy-bill upload calls the separately hosted secure upload endpoint configured in `app.js`, because GitHub Pages cannot store private files.

## Lead and booking behaviour

Lead details are sent to the Google Apps Script address configured near the top of `app.js`. The appointment request opens a pre-filled Google Calendar event in the visitor's Google Calendar with `mark.fitzpatrick@classaenergy.com.au` added as a guest. When the visitor saves the event, Mark receives the invitation. Appointment times are clearly marked as subject to confirmation.

If a recent bill is attached, the file is limited to PDF/JPG/PNG and 10 MB. Its private, unguessable retrieval link is included in the lead record and calendar notes.

For live availability and automatic prevention of double bookings, replace this calendar link flow with a Google Calendar Appointment Schedule link in a future version.

## Important calculator note

All outputs are planning estimates only. The calculator does not replace a site assessment, interval-data review, network approval, engineering design or formal quotation.
