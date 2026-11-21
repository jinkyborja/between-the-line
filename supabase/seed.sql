-- Between the Lines — seed content (safe to re-run).
-- All poems and quotes here are original sample pieces written for this app.

insert into public.categories (slug, name, description, sort_order) values
  ('love',          'Love',          'The quiet and the overwhelming kinds.',            1),
  ('heartbreak',    'Heartbreak',    'When something ends before you are ready.',        2),
  ('relationships', 'Relationships', 'The people we keep, and how we keep them.',        3),
  ('longing',       'Longing',       'Missing what is gone, or what never was.',         4),
  ('healing',       'Healing',       'Slow mending. Small good days.',                   5),
  ('self-love',     'Self-Love',     'Learning to be on your own side.',                 6),
  ('growth',        'Growth',        'Becoming someone, a little at a time.',            7),
  ('life',          'Life',          'Ordinary days, looked at closely.',                8),
  ('friendship',    'Friendship',    'The ones who stay, and the ones who drift.',       9),
  ('letting-go',    'Letting Go',    'Opening your hand.',                              10)
on conflict (slug) do nothing;

with c as (select id, slug from public.categories)
insert into public.poems (slug, kind, title, author, category_id, body, reflection_prompts, reading_minutes, is_featured, featured_on)
select v.slug, v.kind, v.title, v.author, c.id, v.body, v.prompts, v.mins, v.featured, v.featured_on
from (values
  ('the-kettle-still-remembers', 'poem', 'The Kettle Still Remembers', 'Mara Ellison', 'healing',
   E'I still set out two cups some mornings —\nnot from hope, from habit,\nthe way a river keeps its bend\nlong after the flood has gone.\n\nThe kettle doesn’t know you left.\nIt sings the same two-person song,\nand I let it. Some mornings\nI even hum along.\n\nYour chair has become a place\nI put the mail. The mail\nhas become a reason\nnot to sit there.\n\nI am not over you. I am\naround you, the way water\nlearns the shape of a stone\nand keeps on moving.\n\nI am learning to pour for one\nwithout calling it less.',
   array['Is there a habit you’ve kept for someone who isn’t here?', 'What would it mean to pour for one “without calling it less”?'],
   1, true, current_date),
  ('unsent', 'poem', 'Unsent', 'Jonah Weil', 'longing',
   E'I wrote you every word I owed you\nand folded them into the drawer\nwhere I keep the things\nthat are true but not useful.\n\nSome nights I open it\njust to check they’re still there,\nthe way you touch a bruise\nto see if it still hurts.\n\nIt does. Less.\nThat is the whole report.',
   array['What would you say if you knew it would never be sent?', 'What are you keeping that is true but not useful?'],
   1, true, null),
  ('inventory', 'poem', 'Inventory', 'Priya Anand', 'self-love',
   E'Today I counted what stayed:\nmy hands, my stubborn laugh,\nthe light that finds my kitchen at four.\nIt was more than I had guessed.\n\nI had been counting the other column\nfor so long\nI forgot there was a ledger\nwith my name on both sides.',
   array['What stayed, when other things left?', 'What would your own inventory hold today?'],
   1, true, null),
  ('small-hours', 'poem', 'Small Hours', 'Elio Brandt', 'love',
   E'Love, it turns out, is mostly this:\nyou, half-asleep, moving your foot\nso mine has somewhere\nwarm to go.\n\nNot the airport, not the letters.\nThis. The unasked-for room\nmade in the dark\nby someone who isn’t even awake.',
   array['Where do you notice love in the smallest gestures?'],
   1, true, null),
  ('letting-the-door-close', 'poem', 'Letting the Door Close', 'Ines Varga', 'letting-go',
   E'I kept knocking long after\nthe house had moved.\n\nNobody was a villain.\nThe door simply finished\nbeing a door,\nand I am allowed\nto finish being a hand.',
   array['Is there a door you are still knocking on?', 'What would it feel like to give yourself permission to stop?'],
   1, false, null),
  ('old-friend', 'poem', 'Old Friend', 'Sade Okafor', 'friendship',
   E'We don’t call much now.\nBut when we do,\nwe start mid-sentence,\nas if the years were only\na long breath\nbetween two words.',
   array['Who could you call tonight and start mid-sentence?'],
   1, false, null),
  ('what-the-rain-knew', 'poem', 'What the Rain Knew', 'Tomás Ruiz', 'growth',
   E'The rain never asked the field\nwhat it wanted to become.\nIt only kept arriving,\nsoft and without opinion,\nuntil the field\nremembered.',
   array['What has kept arriving for you, quietly, without asking?'],
   1, false, null),
  ('a-map-of-your-absence', 'poem', 'A Map of Your Absence', 'Jonah Weil', 'heartbreak',
   E'I could draw it from memory:\nthe café we stopped going to,\nthe street I walk around now,\nthe song I skip in the first second.\n\nA whole city\nrearranged around one missing person,\nand still I keep finding\nnew places you are not.',
   array['Which places have changed shape since someone left?'],
   1, false, null),
  ('two-chairs', 'poem', 'Two Chairs', 'Mara Ellison', 'relationships',
   E'We bought two chairs that didn’t match\nbecause we couldn’t agree,\nand twenty years later\nthey are the only thing in the room\nthat looks exactly like us.',
   array['What small disagreement became part of who you are together?'],
   1, false, null),
  ('soft-place', 'poem', 'Soft Place', 'Priya Anand', 'healing',
   E'Be a soft place today.\nNot for anyone else —\njust somewhere\nyou could land\nif you fell.',
   array['What would being a soft place for yourself look like today?'],
   1, false, null),
  ('ordinary-tuesday', 'poem', 'Ordinary Tuesday', 'Tomás Ruiz', 'life',
   E'Nothing happened today,\nwhich is to say: the bread rose,\nthe neighbour waved,\nthe light did that thing on the wall.\n\nI am learning that\nnothing happening\nis one of the ways\nthe world says stay.',
   array['What small thing happened today that you almost missed?'],
   1, false, null),
  ('quote-mid-sentence', 'quote', 'On staying', 'Sade Okafor', 'friendship',
   E'The best friendships are the ones you can leave mid-sentence and come back to years later, still in the same breath.',
   array['Who do you still share a breath with, across the years?'], 1, false, null),
  ('quote-around-not-over', 'quote', 'Around, not over', 'Mara Ellison', 'healing',
   E'You don’t have to get over it. Sometimes it is enough to learn how to go around it.',
   array['What are you learning to go around, rather than over?'], 1, false, null),
  ('quote-permission', 'quote', 'Permission', 'Ines Varga', 'letting-go',
   E'Some endings are not failures. They are permission.',
   array['Is there an ending that might really be permission?'], 1, false, null),
  ('quote-your-own-side', 'quote', 'Your own side', 'Priya Anand', 'self-love',
   E'One day you will notice you have been on your own side for a while now, and you will not remember deciding to be.',
   array['When did you last take your own side?'], 1, false, null)
) as v(slug, kind, title, author, cat, body, prompts, mins, featured, featured_on)
join c on c.slug = v.cat
on conflict (slug) do nothing;
