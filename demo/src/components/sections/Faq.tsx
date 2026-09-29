import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

export function AccordionDemo() {
    return (
        <Accordion type="single" collapsible className="w-full mx-auto px-10">
            <AccordionItem value="item-1">
                <AccordionTrigger>Do you provide lifetime websites?</AccordionTrigger>
                <AccordionContent>
                    Yes! At 1s Labs, you only pay once and your website stays active for a lifetime — no hidden fees, no monthly costs.
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>Can I request a custom website?</AccordionTrigger>
                <AccordionContent>
                    Absolutely. Every business is unique, and we build websites tailored to your specific needs, whether for offices, cafés, or any other industry.
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>How long does it take to build my website?</AccordionTrigger>
                <AccordionContent>
                    Most projects are completed within 1 weeks, depending on the complexity and requested features.
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
                <AccordionTrigger>Will my website work on mobile devices?</AccordionTrigger>
                <AccordionContent>
                    Yes. Every website we build is fully responsive, optimized to look and perform perfectly on desktops, tablets, and smartphones.
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
                <AccordionTrigger>Do you offer support after the website is launched?</AccordionTrigger>
                <AccordionContent>
                    Of course. We provide ongoing support and updates when needed, so your website always stays up-to-date and secure.
                </AccordionContent>
            </AccordionItem>
        </Accordion>

    );
}