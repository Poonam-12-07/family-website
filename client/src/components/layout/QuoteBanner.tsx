import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

const QUOTES = [
  { text: 'Small steps every day lead to big financial freedom.', author: '— Wisdom' },
  { text: 'A budget is telling your money where to go instead of wondering where it went.', author: '— Dave Ramsey' },
  { text: 'Do not save what is left after spending; spend what is left after saving.', author: '— Warren Buffett' },
  { text: 'The habit of saving is itself an education.', author: '— T.T. Munger' },
  {
    text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: '— Dave Ramsey',
  },
  { text: 'Every dollar you spend is a vote for the kind of world you want to live in.', author: '— Anna Lappé' },
  { text: 'Beware of little expenses; a small leak will sink a great ship.', author: '— Benjamin Franklin' },
  { text: "It's not your salary that makes you rich, it's your spending habits.", author: '— Charles A. Jaffe' },
  { text: 'The secret to wealth is simple: spend less than you earn.', author: '— Thomas J. Stanley' },
  { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: '— Chris Rock' },
  { text: 'An investment in knowledge pays the best interest.', author: '— Benjamin Franklin' },
  { text: 'Tracking your money is the first step to mastering it.', author: '— SpendWise' },
  { text: 'Mindful spending today, meaningful living tomorrow.', author: '— SpendWise' },
  { text: 'You are one good financial habit away from changing your life.', author: '— SpendWise' },
];

// One quote per day, stable across page loads.
export function QuoteBanner() {
  const quote = useMemo(() => {
    const now = new Date();
    return QUOTES[(now.getDate() + now.getMonth() * 31) % QUOTES.length];
  }, []);

  return (
    <div className="mx-4 mb-0 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-100/80 via-violet-50/90 to-purple-100/80 border border-purple-200/60 shadow-sm">
      <div className="flex items-start gap-2.5 max-w-7xl mx-auto">
        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <div>
          <p
            className="text-sm text-purple-800 leading-relaxed"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
          >
            "{quote.text}"
          </p>
          <p className="text-xs text-purple-500 mt-0.5 font-medium tracking-wide">{quote.author}</p>
        </div>
      </div>
    </div>
  );
}
