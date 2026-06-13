export const QUOTES = [
  { text: 'Small steps every day lead to big results over time.', author: 'LifeOS' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'You do not have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Consistency is what transforms average into excellence.', author: 'LifeOS' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Motivation gets you going, but discipline keeps you growing.', author: 'John C. Maxwell' },
  { text: 'Focus on progress, not perfection.', author: 'LifeOS' },
  { text: 'A year from now you will wish you had started today.', author: 'Karen Lamb' },
  { text: 'Every day is a chance to get a little better than yesterday.', author: 'LifeOS' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The only bad workout is the one that did not happen.', author: 'LifeOS' },
  { text: '做一点总比什么都不做好.', author: 'LifeOS' },
  { text: 'Be so good they cannot ignore you.', author: 'Steve Martin' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'LifeOS' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'LifeOS' },
  { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh' },
  { text: 'Do not watch the clock. Do what it does — keep going.', author: 'Sam Levenson' },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
  { text: 'You are one focused session away from a totally different day.', author: 'LifeOS' },
  { text: 'The pain of discipline is far less than the pain of regret.', author: 'LifeOS' },
  { text: 'Progress is impossible without change.', author: 'George Bernard Shaw' },
  { text: 'Win the morning, win the day.', author: 'LifeOS' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { text: 'Slow progress is still progress.', author: 'LifeOS' },
  { text: 'You will never always be motivated, so you must learn to be disciplined.', author: 'LifeOS' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Today’s accomplishments were yesterday’s impossibilities.', author: 'Robert H. Schuller' },
  { text: 'One day or day one. You decide.', author: 'LifeOS' },
]

// Fix the line with non-English text replaced for consistency
QUOTES[11] = { text: 'Doing a little is always better than doing nothing.', author: 'LifeOS' }

export function getQuoteForDate(dateKey) {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) % QUOTES.length
  }
  return QUOTES[Math.abs(hash) % QUOTES.length]
}
