// English dictionary for random mode (CONF-03), from the most frequent word to
// the least frequent. The rank is a complexity criterion (CONF-05).
export const EN_COMMON = `
the be to of and a in that have it for not on with he as you do at this but his
by from they we say her she or an will my one all would there their what so up
out if about who get which go me when make can like time no just him know take
people into year your good some could them see other than then now look only
come its over think also back after use two how our work first well way even new
want because any these give day most us find here thing many long little very
call world school still try last ask need feel three high leave hand old put big
group begin seem help show hear play run move live child start city home game
team word line fast slow race win lose keep turn light write read sing book page
cat dog bird fish tree sun moon star rain snow wind fire water sea sky road door
red blue green black white gray warm cold kind happy sad soon late early night
morning week month friend family mother father house room table chair window
car train boat walk jump swim laugh smile sleep dream open close stop wait learn
answer question idea story music picture letter paper key screen mouse type
`
  .trim()
  .split(/\s+/);

// Rarer or longer words, kept for the hard level.
export const EN_RARE = `
quintessential kaleidoscope rhythm onomatopoeia serendipity labyrinthine
xylophone hippopotamus chrysanthemum ephemeral juxtaposition mischievous
conscientious bureaucracy pharaoh silhouette surreptitious idiosyncrasy
ubiquitous zephyr flabbergasted cacophony perspicacious magnanimous whimsical
nonchalant onslaught paraphernalia quixotic rendezvous sycophant vicissitude
`
  .trim()
  .split(/\s+/);
