import Head from "next/head";
import { useState } from "react";

import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import RevealOnScroll from "../ui/RevealOnScroll";

const faqItems = [
  {
    question: "What is IranConnect?",
    answer:
      "IranConnect is a directory designed to help people discover Iranian-owned businesses and Iranian professionals across different cities and service categories.",
  },
  {
    question: "How can I find Iranian businesses near me?",
    answer:
      "Use IranConnect search filters to explore businesses by country, city, category, subcategory, or keyword and find relevant services in your area.",
  },
  {
    question:
      "What types of businesses and professionals can I find on IranConnect?",
    answer:
      "IranConnect covers a growing range of categories, including professional services, healthcare, legal services, beauty and wellness, home services, restaurants, and other local businesses.",
  },
  {
    question: "Which countries and cities does IranConnect cover?",
    answer:
      "IranConnect is built to support Iranian communities across multiple cities in Europe and North America, with additional locations and businesses added as the directory grows.",
  },
  {
    question: "Is it free to search for businesses on IranConnect?",
    answer:
      "Yes. Visitors can search and explore public business profiles on IranConnect without paying a search fee.",
  },
  {
    question: "How can I add my business to IranConnect?",
    answer:
      "Business owners and professionals can use the Add Your Business process to submit their information for inclusion in the IranConnect directory.",
  },
  {
    question: "Can I claim an existing business profile?",
    answer:
      "Yes. If a business profile already exists on IranConnect, an eligible owner or representative can use the claim process to request ownership verification.",
  },
  {
    question:
      "How can I update my business information on IranConnect?",
    answer:
      "Verified business owners can use their account workflow to request updates to business information and keep their profile accurate and current.",
  },
  {
    question: "How are reviews handled on IranConnect?",
    answer:
      "Reviews are subject to IranConnect's review and moderation workflow before approved reviews are shown publicly on business profiles.",
  },
  {
    question:
      "How can IranConnect help my business reach more customers?",
    answer:
      "A complete IranConnect profile can make it easier for people searching for Iranian businesses and professionals to discover your services, location, contact information, and other useful business details.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] =
    useState(null);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  function toggleItem(index) {
    setOpenIndex((current) =>
      current === index ? null : index
    );
  }

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredData
            ),
          }}
        />
      </Head>

      <SectionWrapper>
        <RevealOnScroll>
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Find quick answers about discovering, adding, claiming, and managing businesses on IranConnect."
            center
          />
        </RevealOnScroll>

        <div
          className="
            mx-auto
            max-w-4xl
            space-y-4
          "
        >
          {faqItems.map((item, index) => {
            const isOpen =
              openIndex === index;

            const answerId =
              `faq-answer-${index}`;

            const buttonId =
              `faq-question-${index}`;

            return (
              <RevealOnScroll
                key={item.question}
                delayMs={Math.min(
                  (index % 4) * 45,
                  135
                )}
              >
                <div
                  className="
                    admin-card
                    overflow-hidden
                  "
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() =>
                        toggleItem(index)
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-5
                        px-5
                        py-5
                        md:px-6
                        md:py-6
                        text-left
                      "
                    >
                      <span
                        className="
                          text-base
                          md:text-lg
                          font-semibold
                          leading-snug
                          text-[var(--text)]
                        "
                      >
                        {item.question}
                      </span>

                      <span
                        aria-hidden="true"
                        className="
                          relative
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-turquoise/30
                          text-turquoise
                        "
                      >
                        <span
                          className="
                            absolute
                            h-[2px]
                            w-3.5
                            rounded-full
                            bg-current
                          "
                        />

                        <span
                          className={`
                            absolute
                            h-3.5
                            w-[2px]
                            rounded-full
                            bg-current
                            transition-[transform,opacity]
                            duration-300
                            ease-[cubic-bezier(0.22,1,0.36,1)]
                            motion-reduce:transition-none
                            ${
                              isOpen
                                ? "rotate-90 opacity-0"
                                : "rotate-0 opacity-100"
                            }
                          `}
                        />
                      </span>
                    </button>
                  </h3>

                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={buttonId}
                    aria-hidden={!isOpen}
                    className="
                      grid
                      transition-[grid-template-rows,opacity]
                      duration-500
                      ease-[cubic-bezier(0.22,1,0.36,1)]
                      motion-reduce:transition-none
                    "
                    style={{
                      gridTemplateRows: isOpen
                        ? "1fr"
                        : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="
                          px-5
                          pb-5
                          md:px-6
                          md:pb-6
                          text-sm
                          md:text-base
                          leading-relaxed
                          text-muted
                        "
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </SectionWrapper>
    </>
  );
}
