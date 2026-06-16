import { funnelsEn } from './funnels-i18n';
import { tbSignalsEn } from './tb-signals-i18n';

export type DemoLang = 'en' | 'sv';

const en: Record<string, string> = {
  'generic.continue': 'Continue',
  'generic.back': 'Back',
  'generic.error': 'Oops, something went wrong!',
  'generic.validation.error-maxlength-50': 'This field must be less than 50 characters',
  'generic.copyToClipboard.copy': 'Copy to clipboard',
  'generic.copyToClipboard.copied': 'Copied to clipboard',
  'generic.copyToClipboard.failed': 'Failed to copy to clipboard',
  'onboarding.steps.domain': 'Domain',
  'onboarding.steps.companyType': 'Company Type',
  'onboarding.steps.integrations': 'Integrations',
  'onboarding.steps.install': 'Install',
  'onboarding.domain.title': 'Connect your site',
  'onboarding.domain.subtitle':
    "We'll grab your brand colors and fonts to style your campaigns automatically.",
  'onboarding.domain.urlLabel': 'Website URL',
  'onboarding.domain.emptyError': 'Please enter a domain',
  'onboarding.domain.invalidError':
    'Please enter a valid domain like example.com or https://example.com',
  'onboarding.domain.blockedError':
    'This domain is not eligible for Triggerbee. Please use your own website domain.',
  'onboarding.domain.confirmed': 'Domain confirmed successfully',
  'onboarding.companyType.title': 'What type of company are you?',
  'onboarding.companyType.subtitle':
    'This helps us tailor your experience with the right features and templates for your business.',
  'onboarding.companyType.types.b2b': 'B2B',
  'onboarding.companyType.types.ecommerce': 'Ecommerce',
  'onboarding.companyType.types.media': 'Media',
  'onboarding.companyType.types.agency': 'Agency',
  'onboarding.companyType.types.saas': 'SaaS',
  'onboarding.companyType.types.other': 'Other',
  'onboarding.integrations.title': 'Select your integrations',
  'onboarding.integrations.subtitle': 'Choose your website platform and CRM integrations.',
  'onboarding.integrations.skip': 'Skip for now',
  'onboarding.integrations.websitePlatform': 'Website platform',
  'onboarding.integrations.crm': 'CRM',
  'onboarding.integrations.otherLabel': "Don't see your integration?",
  'onboarding.integrations.otherInputLabel': 'CRM or Integration Name',
  'onboarding.integrations.otherPlaceholder': 'Enter your CRM name',
  'onboarding.integrations.continueWith': 'Continue with {{ name }}',
  'onboarding.install.title': 'Install Triggerbee',
  'onboarding.install.subtitle': 'Choose your installation method below.',
  'onboarding.install.trialTitle': 'Your 14-day trial is about to start',
  'onboarding.install.trialInstallOn': 'Install the code on',
  'onboarding.install.trialFeatures':
    'to start your trial and unlock Pro features like quizzes, personalization, surveys, referrals, and CRM targeting.',
  'onboarding.install.soon': 'soon.',
  'onboarding.install.copyCode': 'Copy code',
  'onboarding.install.panels.recommended': 'Recommended',
  'onboarding.install.panels.helperLink': 'Install Triggerbee Helper',
  'onboarding.install.panels.verifyText': 'Verify the installation is working.',
  'onboarding.install.panels.gtm.title': 'Google Tag Manager',
  'onboarding.install.panels.gtm.installTemplateText':
    "Install Triggerbee's Tracking Template in your workspace.",
  'onboarding.install.panels.gtm.installTemplateLink': 'Install Template',
  'onboarding.install.panels.gtm.addTag': 'Add a new tag using the template and add your Site ID:',
  'onboarding.install.panels.gtm.triggerAllPages': 'Trigger it on all pages.',
  'onboarding.install.panels.gtm.saveAndVerify':
    'Save your container and verify the installation is working.',
  'onboarding.install.panels.manual.title': 'Manual installation',
  'onboarding.install.panels.manual.copyCode': 'Copy the code below:',
  'onboarding.install.panels.manual.pasteHead':
    'Paste the code inside the &lt;head&gt; section of your website, preferably just before the closing &lt;/head&gt; tag.',
  'onboarding.install.panels.manual.deploy': 'Deploy changes to production.',
  'onboarding.install.panels.shopify.title': 'Shopify',
  'onboarding.install.panels.shopify.notificationMessage':
    'Exciting news! Our Shopify app is currently under review and will be available in the ',
  'onboarding.install.panels.shopify.notificationLinkText': 'Shopify App Store',
  'onboarding.install.panels.shopify.useGtm':
    "If you're using Google Tag Manager and Shopify, we <strong>highly recommend</strong> installing Triggerbee using the Google Tag Manager method instead (see the GTM panel).",
  'onboarding.install.panels.shopify.advancedGuide':
    'Alternatively, you can follow the steps in this article for advanced installation.',
  'onboarding.install.panels.shopify.advancedGuideLink': 'View Installation Guide (Advanced)',
  'onboarding.install.panels.wordpress.title': 'WordPress',
  'onboarding.install.panels.wordpress.installPlugin': 'Install the Triggerbee WordPress plugin',
  'onboarding.install.panels.wordpress.installPluginLink': 'Download Plugin',
  'onboarding.install.panels.wordpress.activatePlugin':
    'Activate the plugin in your WordPress admin',
  'onboarding.install.panels.wordpress.navigateSettings': 'Navigate to Settings → Triggerbee',
  'onboarding.install.panels.wordpress.enterSiteId': 'Enter your Site ID:',
  'onboarding.install.panels.wordpress.saveSettings': 'Save your settings',
  'onboarding.install.panels.sendToDev.title': 'Send to developer',
  'onboarding.install.panels.sendToDev.sendEmail':
    'Send installation instructions to your developer via email',
  'onboarding.install.panels.sendToDev.includeSiteId': 'Include your Site ID:',
  'onboarding.install.panels.sendToDev.includeCode': 'Include the tracking code:',
  'onboarding.install.panels.sendToDev.askDev':
    'Ask them to install it in the &lt;head&gt; section of your website',
  'onboarding.install.panels.sendToDev.sendEmailAction': 'Send Email to Developer',
  'onboarding.install.panels.sendToDev.emailSubject': 'Triggerbee Installation Instructions',
  'onboarding.install.panels.sendToDev.emailBody':
    "Hi,\n\nPlease install the Triggerbee tracking code on our website.\n\nSite ID: {{ siteId }}\n\nTracking Code:\n{{ scriptSnippet }}\n\nInstructions:\n1. Add the tracking code in the <head> section of the website\n2. Place it just before the closing </head> tag\n3. Deploy the changes to production\n\nLet me know once it's installed so I can verify it's working.\n\nThanks!",
  'onboarding.install.notDetectedDialog.title': 'Script not detected',
  'onboarding.install.notDetectedDialog.message':
    'We couldn\'t detect the Triggerbee script on your website automatically. Visit your site in a new tab to trigger the script, then click "Check again".',
  'onboarding.install.notDetectedDialog.openSite': 'Open {{domain}}',
  'onboarding.install.notDetectedDialog.skip': 'Skip for now',
  'onboarding.install.notDetectedDialog.checkAgain': 'Check again',
};

const sv: Record<string, string> = {
  'generic.continue': 'Fortsätt',
  'generic.back': 'Tillbaka',
  'generic.error': 'Åh nej... Nu är det en massa bin i serverhallen igen. Försök igen!',
  'generic.validation.error-maxlength-50': 'Detta fält får inte vara längre än 50 tecken',
  'generic.copyToClipboard.copy': 'Kopiera till urklipp',
  'generic.copyToClipboard.copied': 'Kopierat!',
  'generic.copyToClipboard.failed': 'Misslyckades att kopiera till urklipp',
  'onboarding.steps.domain': 'Domän',
  'onboarding.steps.companyType': 'Företagstyp',
  'onboarding.steps.integrations': 'Integrationer',
  'onboarding.steps.install': 'Installera',
  'onboarding.domain.title': 'Anslut din webbplats',
  'onboarding.domain.subtitle':
    'Vi hämtar dina varumärkesfärger och typsnitt för att styla dina kampanjer automatiskt.',
  'onboarding.domain.urlLabel': 'Webbplats-URL',
  'onboarding.domain.emptyError': 'Vänligen ange en domän',
  'onboarding.domain.invalidError':
    'Vänligen ange en giltig domän, t.ex. example.com eller https://example.com',
  'onboarding.domain.blockedError':
    'Den här domänen är inte tillgänglig för Triggerbee. Använd din egen webbplatsdomän.',
  'onboarding.domain.confirmed': 'Domän bekräftad',
  'onboarding.companyType.title': 'Vilken typ av företag är ni?',
  'onboarding.companyType.subtitle':
    'Detta hjälper oss att anpassa din upplevelse med rätt funktioner och mallar för din verksamhet.',
  'onboarding.companyType.types.b2b': 'B2B',
  'onboarding.companyType.types.ecommerce': 'E-handel',
  'onboarding.companyType.types.media': 'Media',
  'onboarding.companyType.types.agency': 'Byrå',
  'onboarding.companyType.types.saas': 'SaaS',
  'onboarding.companyType.types.other': 'Annat',
  'onboarding.integrations.title': 'Välj dina integrationer',
  'onboarding.integrations.subtitle': 'Välj din webbplattform och CRM-integrationer.',
  'onboarding.integrations.skip': 'Hoppa över för nu',
  'onboarding.integrations.websitePlatform': 'Webbplattform',
  'onboarding.integrations.crm': 'CRM',
  'onboarding.integrations.otherLabel': 'Ser du inte din integration?',
  'onboarding.integrations.otherInputLabel': 'CRM eller integrationsnamn',
  'onboarding.integrations.otherPlaceholder': 'Ange ditt CRM-namn',
  'onboarding.integrations.continueWith': 'Fortsätt med {{ name }}',
  'onboarding.install.title': 'Installera Triggerbee',
  'onboarding.install.subtitle': 'Välj din installationsmetod nedan.',
  'onboarding.install.trialTitle': 'Din 14-dagars testperiod är på väg att börja',
  'onboarding.install.trialInstallOn': 'Installera koden på',
  'onboarding.install.trialFeatures':
    'för att starta din testperiod och låsa upp Pro-funktioner som quiz, personalisering, enkäter, rekommendationer och CRM-målgruppering.',
  'onboarding.install.soon': 'snart.',
  'onboarding.install.copyCode': 'Kopiera kod',
  'onboarding.install.panels.recommended': 'Rekommenderad',
  'onboarding.install.panels.helperLink': 'Installera Triggerbee Helper',
  'onboarding.install.panels.verifyText': 'Verifiera att installationen fungerar.',
  'onboarding.install.panels.gtm.title': 'Google Tag Manager',
  'onboarding.install.panels.gtm.installTemplateText':
    'Installera Triggerbees spårningsmall i ditt arbetsområde.',
  'onboarding.install.panels.gtm.installTemplateLink': 'Installera mall',
  'onboarding.install.panels.gtm.addTag':
    'Lägg till en ny tagg med hjälp av mallen och ange ditt webbplats-ID:',
  'onboarding.install.panels.gtm.triggerAllPages': 'Aktivera den på alla sidor.',
  'onboarding.install.panels.gtm.saveAndVerify':
    'Spara din behållare och verifiera att installationen fungerar.',
  'onboarding.install.panels.manual.title': 'Manuell installation',
  'onboarding.install.panels.manual.copyCode': 'Kopiera koden nedan:',
  'onboarding.install.panels.manual.pasteHead':
    'Klistra in koden inuti &lt;head&gt;-sektionen på din webbplats, helst precis innan den avslutande &lt;/head&gt;-taggen.',
  'onboarding.install.panels.manual.deploy': 'Driftsätt ändringarna till produktion.',
  'onboarding.install.panels.shopify.title': 'Shopify',
  'onboarding.install.panels.shopify.notificationMessage':
    'Spännande nyheter! Vår Shopify-app är under granskning och kommer att finnas i ',
  'onboarding.install.panels.shopify.notificationLinkText': 'Shopify App Store',
  'onboarding.install.panels.shopify.useGtm':
    'Om du använder Google Tag Manager och Shopify <strong>rekommenderar vi starkt</strong> att du installerar Triggerbee via Google Tag Manager-metoden istället (se GTM-panelen).',
  'onboarding.install.panels.shopify.advancedGuide':
    'Alternativt kan du följa stegen i den här artikeln för avancerad installation.',
  'onboarding.install.panels.shopify.advancedGuideLink': 'Visa installationsguide (avancerad)',
  'onboarding.install.panels.wordpress.title': 'WordPress',
  'onboarding.install.panels.wordpress.installPlugin': 'Installera Triggerbee WordPress-plugin',
  'onboarding.install.panels.wordpress.installPluginLink': 'Ladda ner plugin',
  'onboarding.install.panels.wordpress.activatePlugin': 'Aktivera plugin i din WordPress-admin',
  'onboarding.install.panels.wordpress.navigateSettings':
    'Navigera till Inställningar → Triggerbee',
  'onboarding.install.panels.wordpress.enterSiteId': 'Ange ditt webbplats-ID:',
  'onboarding.install.panels.wordpress.saveSettings': 'Spara dina inställningar',
  'onboarding.install.panels.sendToDev.title': 'Skicka till utvecklare',
  'onboarding.install.panels.sendToDev.sendEmail':
    'Skicka installationsinstruktioner till din utvecklare via e-post',
  'onboarding.install.panels.sendToDev.includeSiteId': 'Inkludera ditt webbplats-ID:',
  'onboarding.install.panels.sendToDev.includeCode': 'Inkludera spårningskoden:',
  'onboarding.install.panels.sendToDev.askDev':
    'Be dem installera den i &lt;head&gt;-sektionen på din webbplats',
  'onboarding.install.panels.sendToDev.sendEmailAction': 'Skicka e-post till utvecklare',
  'onboarding.install.panels.sendToDev.emailSubject': 'Triggerbee installationsinstruktioner',
  'onboarding.install.panels.sendToDev.emailBody':
    'Hej,\n\nVänligen installera Triggerbees spårningskod på vår webbplats.\n\nWebbplats-ID: {{ siteId }}\n\nSpårningskod:\n{{ scriptSnippet }}\n\nInstruktioner:\n1. Lägg till spårningskoden i <head>-sektionen på webbplatsen\n2. Placera den precis före den avslutande </head>-taggen\n3. Driftsätt ändringarna till produktion\n\nMeddela mig när det är installerat så kan jag verifiera att det fungerar.\n\nTack!',
  'onboarding.install.notDetectedDialog.title': 'Skriptet hittades inte',
  'onboarding.install.notDetectedDialog.message':
    'Vi kunde inte hitta Triggerbee-skriptet på din webbplats automatiskt. Besök din webbplats i en ny flik för att trigga skriptet, klicka sedan på "Kontrollera igen".',
  'onboarding.install.notDetectedDialog.openSite': 'Öppna {{domain}}',
  'onboarding.install.notDetectedDialog.skip': 'Hoppa över',
  'onboarding.install.notDetectedDialog.checkAgain': 'Kontrollera igen',
};

Object.assign(en, funnelsEn, tbSignalsEn);

const dictionaries: Record<DemoLang, Record<string, string>> = { en, sv };

export function resolveTranslation(
  key: string,
  lang: DemoLang,
  params?: Record<string, unknown>,
): string {
  const table = dictionaries[lang] ?? dictionaries.en;
  let value = table[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const paramKey of Object.keys(params)) {
      value = value.replace(
        new RegExp('\\{\\{\\s*' + paramKey + '\\s*\\}\\}', 'g'),
        String(params[paramKey]),
      );
    }
  }
  return value;
}
