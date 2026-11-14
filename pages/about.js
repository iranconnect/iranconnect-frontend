//pages/about.js
import LegalLayout from "../components/LegalLayout";
import { useSentryPageTags } from "../hooks/useSentryPageTags";


const texts = {
  en: `
    <h1>About IranConnect</h1>
    <p><strong>Connecting Iranian Communities Across Borders</strong></p>

    <p>IranConnect is an online directory that helps people discover Iranian professionals, service providers, and Iranian-owned businesses abroad.</p>

    <p>Our mission is to make it easier for Iranian communities to find relevant services, explore local businesses, and connect with professionals who may understand their language and cultural background.</p>

    <h2>How IranConnect Works</h2>
    <p>Visitors can search for businesses and professionals by location, service category, or keyword, explore public business profiles, and use the available contact information to reach providers directly.</p>
    <p>Searching and browsing public listings is free.</p>

    <h2>Business Listings &amp; Ownership</h2>
    <p>A business listing presents information about a provider, such as its services, location, and contact details.</p>
    <p>Business owners can request to add their business to the directory. If their business is already listed, they may submit a claim to request verification of their ownership or authority to manage the listing.</p>
    <p>Verified owners can use the available account tools to request updates to their business information, subject to the platform's review process.</p>

    <h2>What Verified Ownership Means</h2>
    <p>Verified Ownership indicates that IranConnect has accepted a request to verify a person's ownership of, or authority to manage, a business listing.</p>
    <p>It does not mean that IranConnect has certified the provider's professional qualifications, licenses, service quality, reliability, or outcomes.</p>
    <p>Business listing, ownership verification, and any subscription arrangements are separate matters.</p>

    <h2>Our Role &amp; Responsibilities</h2>
    <p>IranConnect helps people discover and connect with businesses and professionals. It does not itself provide the services advertised by independent providers.</p>
    <p>Users should independently verify professional qualifications, legal authorizations, service terms, and suitability before engaging a provider. IranConnect does not guarantee the accuracy of all listing information or the results of services provided.</p>

    <h2>Help &amp; More Information</h2>
    <p>For common questions, visit the <a href="/#faq">FAQ section on our homepage</a>. If you need assistance, please use our <a href="/contact">Contact page</a>.</p>
    <p>You can also review our <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms-of-service">Terms of Service</a> for further information about the platform.</p>
  `,

  fr: `
    <h1>À propos d’IranConnect</h1>
    <p><strong>Relier les communautés iraniennes au-delà des frontières</strong></p>

    <p>IranConnect est un annuaire en ligne qui aide à découvrir des professionnels iraniens, des prestataires de services et des entreprises tenues par des Iraniens à l’étranger.</p>

    <p>Notre mission est de faciliter la recherche de services adaptés, la découverte d’entreprises locales et la mise en relation avec des professionnels susceptibles de comprendre la langue et la culture des communautés iraniennes.</p>

    <h2>Comment fonctionne IranConnect</h2>
    <p>Les visiteurs peuvent rechercher des entreprises et des professionnels par lieu, catégorie de services ou mot-clé, consulter les fiches publiques et utiliser les coordonnées disponibles pour contacter directement les prestataires.</p>
    <p>La recherche et la consultation des fiches publiques sont gratuites.</p>

    <h2>Fiches d’entreprise et propriété</h2>
    <p>Une fiche d’entreprise présente des informations sur un prestataire, notamment ses services, sa localisation et ses coordonnées.</p>
    <p>Les propriétaires peuvent demander l’ajout de leur entreprise à l’annuaire. Si une fiche existe déjà, ils peuvent déposer une demande de revendication afin de faire vérifier leur propriété ou leur autorisation de gérer cette fiche.</p>
    <p>Les propriétaires vérifiés peuvent utiliser les outils disponibles dans leur compte pour demander des modifications, sous réserve du processus d’examen de la plateforme.</p>

    <h2>Que signifie la vérification de propriété ?</h2>
    <p>La vérification de propriété indique qu’IranConnect a accepté une demande visant à vérifier qu’une personne est propriétaire d’une entreprise ou autorisée à gérer sa fiche.</p>
    <p>Elle ne signifie pas qu’IranConnect certifie les qualifications professionnelles, les autorisations d’exercice, la qualité des services, la fiabilité ou les résultats du prestataire.</p>
    <p>La présence dans l’annuaire, la vérification de propriété et les éventuels abonnements sont des éléments distincts.</p>

    <h2>Notre rôle et nos responsabilités</h2>
    <p>IranConnect facilite la découverte et la mise en relation avec des entreprises et des professionnels. La plateforme ne fournit pas elle-même les services proposés par les prestataires indépendants.</p>
    <p>Les utilisateurs doivent vérifier eux-mêmes les qualifications, les autorisations légales, les conditions des services et leur adéquation à leurs besoins avant de faire appel à un prestataire. IranConnect ne garantit pas l’exactitude de toutes les informations publiées ni les résultats des services fournis.</p>

    <h2>Aide et informations complémentaires</h2>
    <p>Pour les questions fréquentes, consultez la <a href="/#faq">FAQ sur notre page d’accueil</a>. Si vous avez besoin d’aide, utilisez notre <a href="/contact">page Contact</a>.</p>
    <p>Vous pouvez également consulter notre <a href="/privacy-policy">Politique de confidentialité</a> et nos <a href="/terms-of-service">Conditions d’utilisation</a> pour obtenir davantage d’informations sur la plateforme.</p>
  `,

  fa: `
    <h1>درباره ایران‌کانکت</h1>
    <p><strong>پیوند جامعه ایرانی فراتر از مرزها</strong></p>

    <p>ایران‌کانکت یک دایرکتوری آنلاین است که به افراد کمک می‌کند متخصصان ایرانی، ارائه‌دهندگان خدمات و کسب‌وکارهای ایرانی خارج از کشور را پیدا کنند.</p>

    <p>هدف ما آسان‌تر کردن دسترسی جامعه ایرانی به خدمات موردنیاز، آشنایی با کسب‌وکارهای محلی و ارتباط با متخصصانی است که ممکن است زبان و فرهنگ آن‌ها را بهتر درک کنند.</p>

    <h2>ایران‌کانکت چگونه کار می‌کند؟</h2>
    <p>بازدیدکنندگان می‌توانند بر اساس موقعیت جغرافیایی، دسته‌بندی خدمات یا کلمات کلیدی جست‌وجو کنند، اطلاعات عمومی کسب‌وکارها را ببینند و از طریق اطلاعات تماس درج‌شده، مستقیماً با ارائه‌دهندگان خدمات ارتباط بگیرند.</p>
    <p>جست‌وجو و مشاهده اطلاعات عمومی کسب‌وکارها رایگان است.</p>

    <h2>معرفی کسب‌وکار و مالکیت آن</h2>
    <p>صفحه معرفی هر کسب‌وکار اطلاعاتی مانند خدمات، موقعیت جغرافیایی و راه‌های تماس آن را نمایش می‌دهد.</p>
    <p>صاحبان کسب‌وکار می‌توانند درخواست ثبت کسب‌وکار خود را ارسال کنند. اگر کسب‌وکار آن‌ها از قبل در ایران‌کانکت ثبت شده باشد، می‌توانند از طریق فرآیند درخواست مالکیت، برای تأیید مالکیت یا اختیار مدیریت آن اقدام کنند.</p>
    <p>مالکان تأییدشده می‌توانند از امکانات حساب کاربری خود برای درخواست اصلاح اطلاعات کسب‌وکار استفاده کنند. این درخواست‌ها مطابق فرآیند بررسی پلتفرم رسیدگی می‌شوند.</p>

    <h2>تأیید مالکیت چه معنایی دارد؟</h2>
    <p>تأیید مالکیت به این معناست که ایران‌کانکت درخواست بررسی مالکیت یک شخص یا اختیار او برای مدیریت صفحه کسب‌وکار را پذیرفته است.</p>
    <p>این وضعیت به معنای تأیید مدارک تخصصی، مجوزهای حرفه‌ای، کیفیت خدمات، قابل‌اعتماد بودن ارائه‌دهنده یا تضمین نتیجه خدمات نیست.</p>
    <p>ثبت کسب‌وکار، تأیید مالکیت و هرگونه اشتراک احتمالی، موضوعاتی مستقل از یکدیگر هستند.</p>

    <h2>نقش و مسئولیت‌های ما</h2>
    <p>ایران‌کانکت بستری برای پیدا کردن کسب‌وکارها و برقراری ارتباط با متخصصان است و خدمات معرفی‌شده توسط ارائه‌دهندگان مستقل را مستقیماً ارائه نمی‌کند.</p>
    <p>کاربران باید پیش از استفاده از خدمات، صلاحیت حرفه‌ای، مجوزهای قانونی، شرایط ارائه خدمات و تناسب آن‌ها با نیاز خود را مستقلاً بررسی کنند. ایران‌کانکت صحت تمام اطلاعات ثبت‌شده یا نتایج خدمات ارائه‌دهندگان را تضمین نمی‌کند.</p>

    <h2>راهنمایی و اطلاعات بیشتر</h2>
    <p>برای پاسخ به پرسش‌های متداول می‌توانید به <a href="/#faq">بخش سؤالات رایج در صفحه اصلی</a> مراجعه کنید. در صورت نیاز به راهنمایی یا پشتیبانی، از <a href="/contact">صفحه تماس با ما</a> استفاده کنید.</p>
    <p>همچنین برای اطلاع از جزئیات بیشتر درباره پلتفرم، می‌توانید <a href="/privacy-policy">سیاست حفظ حریم خصوصی</a> و <a href="/terms-of-service">شرایط استفاده از خدمات</a> را مطالعه کنید.</p>
  `,
}

export default function AboutPage() {
  useSentryPageTags({
    feature: "public-about",
  });

  return <LegalLayout texts={texts} editorial />;
}

