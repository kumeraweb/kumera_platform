export {};

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
    gtag_report_wa_conversion?: (url?: string) => boolean;
    gtag_report_phone_conversion?: (url?: string) => boolean;
    gtag_report_form_conversion?: () => boolean;
  }
}
