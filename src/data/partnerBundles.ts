/**
 * Predefined sets of WhatsApp templates that ship with specific partner
 * integrations (Rapid, Optima). Used by the Partner Bundle tab in the
 * Templates Import / Export tool to let users one-click import a known-good
 * starter set into a fresh project.
 *
 * Each template payload here matches the shape consumed by `TemplateInput`
 * in `src/lib/templatesJsonToTexter.ts` (top-level title/category/usage/
 * chatStatus + provider_template.localizations). The galavishai_templates.json
 * export under repo root is the canonical reference for the JSON structure.
 *
 * Replace mock template sets with real partner data as it becomes available;
 * the picker UI keys off `templates.length` so no other code changes needed.
 */

import type { TemplateInput } from "@site/src/lib/templatesJsonToTexter";

export type PartnerTemplate = {
  /** Stable id within the bundle for checkbox state — does NOT have to match
      the template's `name`; safer to derive separately so renaming the
      template doesn't break the checkbox key. */
  id: string;
  /** Human-readable label shown in the picker (usually the template name). */
  name: string;
  /** The actual template object pushed into the importer when selected. */
  template: TemplateInput;
};

/**
 * A user-fillable input shown above the templates list inside a partner card.
 * Whatever the user types here gets string-replaced into the selected
 * templates (across title, body text, etc.) on Save. Lets partners ship
 * templates with literal placeholders like `שם הקליניקה` ("Clinic name")
 * that get filled in once and applied to every template at once.
 */
export type PartnerSeedField = {
  /** Stable id for state keys. */
  id: string;
  /** Label shown above the input. */
  label: string;
  /** The exact literal string in template payloads that this seed replaces. */
  placeholder: string;
  /** Placeholder shown in the input box when empty (NOT the value to seed). */
  inputPlaceholder?: string;
  /** Optional helper hint shown under the input. */
  hint?: string;
};

export type PartnerBundle = {
  /** Stable id used for state keys. */
  id: string;
  /** Display name shown in the picker. */
  name: string;
  /** Short blurb shown under the partner name in the modal. */
  description?: string;
  /** Optional global-seed inputs shown above the templates list. */
  seedFields?: PartnerSeedField[];
  templates: PartnerTemplate[];
};

export const PARTNER_BUNDLES: PartnerBundle[] = [
  {
    id: "rapid",
    name: "Rapid",
    description:
      "Starter template set for clinics integrated with Rapid — free-response, appointments, forms, payments, recalls.",
    templates: [
      // First template = default. Marketing/inbox, chatStatus 1 (BULK), no
      // bot routing — the source spec has reply action "keep the chat
      // assigned to me", which we honor by NOT switching the chat into bot.
      {
        id: "rapid_inbox_default",
        name: "rapid_inbox_default",
        template: {
          name: "rapid_inbox_default",
          title: "מענה חופשי",
          category: "MARKETING",
          usage: "inbox",
          chatStatus: 1,
          isDefault: true,
          departments: [],
          provider_template: {
            name: "rapid_inbox_default",
            category: "MARKETING",
            localizations: [
              {
                name: "rapid_inbox_default",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text: "שלום {{1}} תודה",
                    example: { body_text: [["דנה, נא צרי קשר"]] },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_new_meeting — פגישה חדשה
      {
        id: "bulk_utility_new_meeting",
        name: "bulk_utility_new_meeting",
        template: {
          name: "bulk_utility_new_meeting",
          title: "פגישה חדשה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_new_meeting",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_new_meeting",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "נקבעה לך פגישה במרפאת {{2}} אצל {{3}} בתאריך {{4}}, בשעה {{5}}.\n" +
                      "כתובתנו היא {{6}},\n" +
                      "בתודה והמשך יום נעים.",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          "סניף תל אביב",
                          'ד"ר כהן',
                          "1/1/2026",
                          "10:00",
                          'רחוב הרצל 1, ת"א',
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_meeting_reminder — תזכורת פגישה
      // (Source reply action = "check_working_hours_ra"; per the user's
      // instruction we ignore that and route to bot default like the rest.)
      {
        id: "bulk_utility_meeting_reminder",
        name: "bulk_utility_meeting_reminder",
        template: {
          name: "bulk_utility_meeting_reminder",
          title: "תזכורת פגישה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_meeting_reminder",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_meeting_reminder",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום רב,\n" +
                      "תזכורת לתור במרפאת {{1}}, אצל {{2}} ביום {{3}} בשעה {{4}}.\n" +
                      "כתובתנו היא {{5}}\n" +
                      "נא אשר/י הגעתך בהודעה זו:\n" +
                      "{{6}}\n" +
                      "ללא אישור הגעתך, לא נוכל להבטיח את קיום התור.\n" +
                      "תודה רבה.",
                    example: {
                      body_text: [
                        [
                          "סניף תל אביב",
                          'ד"ר כהן',
                          "1/1/2026",
                          "10:00",
                          'רחוב הרצל 1, ת"א',
                          "https://example.com/confirm",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_financial_form — מסמך פיננסי
      {
        id: "bulk_utility_financial_form",
        name: "bulk_utility_financial_form",
        template: {
          name: "bulk_utility_financial_form",
          title: "מסמך פיננסי",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_financial_form",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_financial_form",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום רב,\n" +
                      "מצורף בזאת {{1}} מספר {{2}} של {{3}}:\n" +
                      "{{4}}\n" +
                      "תודה",
                    example: {
                      body_text: [
                        [
                          "חשבונית",
                          "12345",
                          "סניף תל אביב",
                          "https://example.com/doc.pdf",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_general_form — שליחת טופס
      {
        id: "bulk_utility_general_form",
        name: "bulk_utility_general_form",
        template: {
          name: "bulk_utility_general_form",
          title: "שליחת טופס",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_general_form",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_general_form",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "נא מלא/י את טופס {{2}} של מרפאת {{3}} בהקדם האפשרי בקישור הבא:\n" +
                      "{{4}}\n" +
                      "תוקף הקישור יפוג בתוך 7 ימים.",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          "טופס בריאות",
                          "סניף תל אביב",
                          "https://example.com/form",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_form_reminder — תזכורת טופס
      {
        id: "bulk_utility_form_reminder",
        name: "bulk_utility_form_reminder",
        template: {
          name: "bulk_utility_form_reminder",
          title: "תזכורת טופס",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_form_reminder",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_form_reminder",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "זו תזכורת כי עליך למלא את טופס {{2}} של מרפאת {{3}} בהקדם האפשרי בקישור הבא:\n" +
                      "{{4}}\n" +
                      "תוקף הקישור יפוג תוך 3 ימים.",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          "טופס בריאות",
                          "סניף תל אביב",
                          "https://example.com/form",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // canceled_meeting_utility_bulk — פגישה לא התקיימה
      // (Source body ends with `{{4}}`; moved {{4}} above and put "תודה" at end.)
      {
        id: "canceled_meeting_utility_bulk",
        name: "canceled_meeting_utility_bulk",
        template: {
          name: "canceled_meeting_utility_bulk",
          title: "פגישה לא התקיימה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "canceled_meeting_utility_bulk",
            category: "UTILITY",
            localizations: [
              {
                name: "canceled_meeting_utility_bulk",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "אנו מצטערים כי פגישתך היום עם {{2}} לא התקיימה. במידה וטרם קבעת פגישה חדשה, נא צור קשר עמנו בטלפון {{3}}.\n" +
                      "{{4}}\n" +
                      "תודה",
                    example: {
                      body_text: [
                        ["ישראל", 'ד"ר כהן', "03-1234567", "סניף תל אביב"],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // meeting_virtual_utility_bulk — פגישה וירטואלית חדשה
      {
        id: "meeting_virtual_utility_bulk",
        name: "meeting_virtual_utility_bulk",
        template: {
          name: "meeting_virtual_utility_bulk",
          title: "פגישה וירטואלית חדשה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "meeting_virtual_utility_bulk",
            category: "UTILITY",
            localizations: [
              {
                name: "meeting_virtual_utility_bulk",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "נקבעה לך פגישה וירטואלית עם {{2}} ממרפאת {{3}} ב{{4}} ה{{5}} בשעה {{6}}.\n" +
                      "יש להכנס לפגישה במועד שנקבע לך בקישור הבא:\n" +
                      "{{7}}\n" +
                      "תודה",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          'ד"ר כהן',
                          "סניף תל אביב",
                          "ראשון",
                          "1/1/2026",
                          "10:00",
                          "https://meet.example.com/abc",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_first_payment — תשלום ראשון
      // (Source ends with `{{2}}.`; reordered so "המשך יום נעים" closes the body.)
      {
        id: "bulk_utility_first_payment",
        name: "bulk_utility_first_payment",
        template: {
          name: "bulk_utility_first_payment",
          title: "תשלום ראשון",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_first_payment",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_first_payment",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "אנו שמחים שהצטרפת לחוג לקוחות {{2}}.\n" +
                      "המשך יום נעים",
                    example: {
                      body_text: [["ישראל", "סניף תל אביב"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_debt_reminder — דוח יתרה
      // (Restructured so "בתודה מראש" closes the body.)
      {
        id: "bulk_utility_debt_reminder",
        name: "bulk_utility_debt_reminder",
        template: {
          name: "bulk_utility_debt_reminder",
          title: "דוח יתרה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_debt_reminder",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_debt_reminder",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "ברצוננו ליידעך כי נותר לך חוב בסך {{2}} ₪ ב{{3}}.\n" +
                      "נודה מאוד באם תסדיר/י את חובך.\n" +
                      "לנוחיותך, ניתן לשלם באשראי בטלפון {{4}} או בכתובתינו {{5}}.\n" +
                      "בתודה מראש",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          "500",
                          "סניף תל אביב",
                          "03-1234567",
                          'רחוב הרצל 1, ת"א',
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_medical_check — מעקב רפואי
      // (Reordered so "בברכה" closes the body.)
      {
        id: "bulk_utility_medical_check",
        name: "bulk_utility_medical_check",
        template: {
          name: "bulk_utility_medical_check",
          title: "מעקב רפואי",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_medical_check",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_medical_check",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "זו תזכורת לקביעת בדיקה תקופתית עם {{2}} במרפאת {{3}}.\n" +
                      "באפשרותך לקבוע תור בטלפון {{4}}.\n" +
                      "בברכה",
                    example: {
                      body_text: [
                        ["ישראל", 'ד"ר כהן', "סניף תל אביב", "03-1234567"],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_mail_sent — שליחת מכתב
      // ends with `{{2}}` — added {{3}} URL and closed with "תודה".)
      {
        id: "bulk_utility_mail_sent",
        name: "bulk_utility_mail_sent",
        template: {
          name: "bulk_utility_mail_sent",
          title: "שליחת מכתב",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_mail_sent",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_mail_sent",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "מצורף בזאת מכתב עבורך ממרפאת {{2}} בקישור: {{3}}\n" +
                      "תודה",
                    example: {
                      body_text: [
                        [
                          "ישראל",
                          "סניף תל אביב",
                          "https://example.com/letter.pdf",
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // bulk_utility_new_lead — ליד חדש  (typo "utility" preserved)
      {
        id: "bulk_utility_new_lead",
        name: "bulk_utility_new_lead",
        template: {
          name: "bulk_utility_new_lead",
          title: "ליד חדש",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "bulk_utility_new_lead",
            category: "UTILITY",
            localizations: [
              {
                name: "bulk_utility_new_lead",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "תודה שיצרת קשר עם {{2}},\n" +
                      "פרטיך נקלטו במערכת ונחזור אליך בהקדם האפשרי.",
                    example: {
                      body_text: [["ישראל", "סניף תל אביב"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // referral_utility_bulk — הפניה חדשה
      // (Source body ends with `{{2}}`; reordered so "תודה והמשך יום נעים" closes.)
      {
        id: "referral_utility_bulk",
        name: "referral_utility_bulk",
        template: {
          name: "referral_utility_bulk",
          title: "הפניה חדשה",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "referral_utility_bulk",
            category: "UTILITY",
            localizations: [
              {
                name: "referral_utility_bulk",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום,\n" +
                      "אנו במרפאת {{1}} מודים לך על ההפניה של {{2}}.\n" +
                      "תודה והמשך יום נעים",
                    example: {
                      body_text: [["סניף תל אביב", "ישראל"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // rapid_portal_access — גישה לפורטל  (source row has no ID; name made up)
      {
        id: "rapid_portal_access",
        name: "rapid_portal_access",
        template: {
          name: "rapid_portal_access",
          title: "גישה לפורטל",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "rapid_portal_access",
            category: "UTILITY",
            localizations: [
              {
                name: "rapid_portal_access",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "למעבר לפורטל יש להזין את המלל הבא:\n" +
                      "{{2}}\n" +
                      "תודה",
                    example: {
                      body_text: [["ישראל", "1234"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
    ],
  },
  {
    id: "optima",
    name: "Optima",
    description:
      "Starter set for clinics integrated with Optima — appointment reminders, document sending, recalls.",
    seedFields: [
      {
        id: "clinicName",
        label: "שם הקליניקה",
        placeholder: "שם הקליניקה",
        inputPlaceholder: 'לדוגמה: מרפאת ד"ר כהן',
        hint: 'יוחלף בכל מופע של "שם הקליניקה" בתבניות שייבחרו',
      },
    ],
    templates: [
      // a200 — שליחת מסמך (document send)
      {
        id: "optima_a200",
        name: "a200",
        template: {
          name: "a200",
          title: "שליחת מסמך",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "a200",
            category: "UTILITY",
            localizations: [
              {
                name: "a200",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "HEADER",
                    format: "DOCUMENT",
                    example: {
                      // Placeholder URL — clinic replaces with real PDF before submitting.
                      header_handle: [
                        "https://www.example.com/sample-document.pdf",
                      ],
                    },
                  },
                  {
                    type: "BODY",
                    text: "שלום {{1}},\nנשלח אליך מסמך {{2}}\nתודה - שם הקליניקה",
                    example: {
                      body_text: [["שם הלקוח", "תיאור המסמך"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // a5 — תור עתידי (future appointment)
      {
        id: "optima_a5",
        name: "a5",
        template: {
          name: "a5",
          title: "תור עתידי",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "a5",
            category: "UTILITY",
            localizations: [
              {
                name: "a5",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "נקבעה לך פגישה עתידית אצל {{2}} ביום {{3}} בתאריך {{4}} בשעה {{5}}\n\n" +
                      "שם הקליניקה",
                    example: {
                      body_text: [
                        ["שם הלקוח", "שם הרופא", "ראשון", "1/1/2026", "10:00"],
                      ],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // a1 — תזכורת לתור (appointment reminder)
      {
        id: "optima_a1",
        name: "a1",
        template: {
          name: "a1",
          title: "תזכורת לתור",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "a1",
            category: "UTILITY",
            localizations: [
              {
                name: "a1",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      "זוהי תזכורת לתור אצל {{2}} ביום {{3}} ה{{4}} בשעה {{5}}\n" +
                      "לאישור או לביטול התור יש ללחוץ על הבחירה המתאימה\n" +
                      "תודה רבה 🙏\n" +
                      "שם הקליניקה",
                    example: {
                      body_text: [
                        ["שם הלקוח", "שם הרופא", "ראשון", "1/1/2026", "10:00"],
                      ],
                    },
                  },
                  {
                    type: "BUTTONS",
                    buttons: [
                      { type: "QUICK_REPLY", text: "אישור הגעה" },
                      { type: "QUICK_REPLY", text: "ביטול תור" },
                    ],
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // a2 — ביטול תור (appointment cancellation). PDF has no ID for this row;
      // using a2 to fit the a1/a2/a3 sequence.
      {
        id: "optima_a2",
        name: "a2",
        template: {
          name: "a2",
          title: "ביטול תור",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "a2",
            category: "UTILITY",
            localizations: [
              {
                name: "a2",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text:
                      "שלום {{1}},\n" +
                      'התור שלך לד"ר {{2}} בוטל.\n' +
                      "לקביעת תור חדש נא ליצור קשר עם המרפאה בהודעה חוזרת\n" +
                      "בברכה\n" +
                      "שם הקליניקה",
                    example: {
                      body_text: [["שם הלקוח", "שם הרופא"]],
                    },
                  },
                  {
                    type: "BUTTONS",
                    buttons: [{ type: "QUICK_REPLY", text: "יצירת קשר" }],
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // a3 — תבנית ריקולים (recalls)
      {
        id: "optima_a3",
        name: "a3",
        template: {
          name: "a3",
          title: "תבנית ריקולים",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          provider_template: {
            name: "a3",
            category: "UTILITY",
            localizations: [
              {
                name: "a3",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text: "הגיע הזמן לביקורת שיניים ושיננית, התקשרו עוד היום על מנת לתאם תור ותמשיכו לחייך 😁",
                  },
                  {
                    type: "BUTTONS",
                    buttons: [{ type: "QUICK_REPLY", text: "חייגו עכשיו" }],
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
    ],
  },
  {
    id: "cpa_assist",
    name: "CPA Assist",
    description:
      "Starter set for accounting offices integrated with CPA Assist — client notifications and payment approvals.",
    templates: [
      // cpaassist_general_1 — default generic client notification, no buttons.
      {
        id: "cpaassist_general_1",
        name: "cpaassist_general_1",
        template: {
          name: "cpaassist_general_1",
          title: "הודעה כללית",
          category: "UTILITY",
          usage: "inbox",
          chatStatus: 1,
          isDefault: true,
          departments: [],
          provider_template: {
            name: "cpaassist_general_1",
            category: "UTILITY",
            localizations: [
              {
                name: "cpaassist_general_1",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    text: "שלום רב, רצינו ליידע אותך {{1}}\nתודה",
                    example: {
                      body_text: [["תוכן ההודעה"]],
                    },
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
      // cpaassist_money_approval_1 — monthly payment approval. {{4}} and {{5}}
      // are intentionally in reverse order in the text (per the column-D note
      // in the source spec — "המשתנה 4 וה-5 בסדר הפוך, זו לא טעות, כך חייב להיות").
      {
        id: "cpaassist_money_approval_1",
        name: "cpaassist_money_approval_1",
        template: {
          name: "cpaassist_money_approval_1",
          title: "אישור תשלומים",
          category: "UTILITY",
          usage: "bulk",
          chatStatus: 0,
          isDefault: false,
          departments: [],
          setBotNode: "cpa_assist_buttons",
          provider_template: {
            name: "cpaassist_money_approval_1",
            category: "UTILITY",
            localizations: [
              {
                name: "cpaassist_money_approval_1",
                language: "he",
                parameter_format: "POSITIONAL",
                components: [
                  {
                    type: "BODY",
                    // "תודה" sits on its own line at the very end so the body
                    // doesn't terminate on a variable (WhatsApp rejects that).
                    text:
                      "שלום {{1}} {{2}},\n" +
                      "להלן פירוט התשלומים למוסדות בגין חודש {{3}}:\n" +
                      "{{5}}\n" +
                      "בבקשה אשר/י את התשלומים בכפתורים מטה.\n" +
                      "{{4}}\n" +
                      "תודה",
                    example: {
                      // Examples are listed in numerical order (1..5), even
                      // though {{4}} and {{5}} appear reversed in the text.
                      body_text: [
                        [
                          "שם פרטי",
                          "שם משפחה",
                          "דצמבר",
                          "חתימה",
                          "פירוט תשלומים",
                        ],
                      ],
                    },
                  },
                  {
                    type: "BUTTONS",
                    buttons: [
                      { type: "QUICK_REPLY", text: "לאישור ביצוע" },
                      { type: "QUICK_REPLY", text: "יש לי שאלה" },
                    ],
                  },
                ],
              },
            ],
            metadata: {},
          },
        },
      },
    ],
  },
];
