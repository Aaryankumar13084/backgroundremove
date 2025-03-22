import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI background removal work?",
    answer: "The background remover uses U2Net, a deep learning model specifically trained to identify foreground objects and separate them from the background in images."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we process all images locally on our server. Your images are temporarily stored for processing and automatically deleted after an hour."
  },
  {
    question: "What image formats are supported?",
    answer: "Currently, we support JPEG, PNG, and JPG formats. The maximum file size is 5MB for optimal performance."
  },
  {
    question: "How can I get the best results?",
    answer: "For best results, use images with clear contrast between the subject and background. Adjust the foreground and background threshold settings for fine-tuning."
  }
];

export default function FaqSection() {
  return (
    <div className="mt-16 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-medium text-gray-900">Frequently Asked Questions</h2>
      </div>
      
      <div className="px-6 py-5">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-100 pb-4">
              <AccordionTrigger className="text-lg font-medium text-gray-900">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
