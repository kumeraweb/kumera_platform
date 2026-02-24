import { MessageCircle, Phone } from "lucide-react";
import TrackedWhatsappLink from "@/app/components/TrackedWhatsappLink";
import TrackedCallLink from "@/app/components/TrackedCallLink";

interface ExecutiveStickyCTAProps {
    phoneLink: string;
    phoneConversionSendTo?: string;
    whatsappLink: string;
    hasPlans: boolean;
}

export default function ExecutiveStickyCTA({ phoneLink, phoneConversionSendTo, whatsappLink, hasPlans }: ExecutiveStickyCTAProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:hidden">
            <div className="flex flex-col gap-3">
                {phoneLink !== "#" ? (
                    <TrackedCallLink
                        href={phoneLink}
                        conversionSendTo={phoneConversionSendTo}
                        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform text-center leading-tight whitespace-normal"
                    >
                        <Phone className="w-5 h-5" />
                        Llamar ahora
                    </TrackedCallLink>
                ) : null}
                <TrackedWhatsappLink
                    href={whatsappLink}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3.5 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                </TrackedWhatsappLink>
                {hasPlans ? (
                    <a
                        href="#planes-disponibles"
                        className="flex items-center justify-center w-full text-sm text-slate-600 font-medium py-1"
                    >
                        Ver planes
                    </a>
                ) : null}
            </div>
        </div>
    );
}
