// The built-in quiz. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the demo's own example), 5 options, the right answer is
// not the longest, positions are spread, feedback says why. `correct` is a list:
// more than one index makes it a multiple-answer question.
// Draft for Simon's review: he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [2],
    fr: {
      q: "Deux serveurs doivent valider une même transaction ou l'annuler tous les deux. Ils ne se parlent que par un réseau qui peut perdre n'importe quel message, sans prévenir. Combien d'allers-retours de confirmation faut-il pour que chacun soit CERTAIN que l'autre validera ?",
      o: ['Un seul : la demande, puis sa confirmation', 'Trois, comme la poignée de main de TCP', 'Aucun nombre fini n’y suffit', 'Deux, pour que chacun ait reçu une confirmation', 'Assez pour que les deux aient reçu au moins un message'],
      ok: "Correct! Chaque confirmation doit elle-même être confirmée : le dernier message peut toujours se perdre, et son expéditeur ne le sait pas. En pratique, on accepte un risque résiduel (délais, renvois) au lieu de viser la certitude.",
      ko: "Erreur. Ajouter des allers-retours déplace le doute sans le supprimer : celui qui envoie le dernier message ne sait jamais s'il est arrivé. Aucun nombre fini de messages ne garantit l'accord.",
    },
    en: {
      q: 'Two servers must both commit a transaction or both abort it. They talk only over a network that can lose any message without warning. How many confirmation round trips does it take for each to be CERTAIN the other will commit?',
      o: ['One: the request, then its confirmation', 'Three, like the TCP handshake', 'No finite number is enough', 'Two, so that each has received a confirmation', 'Enough for both to have received at least one message'],
      ok: 'Correct! Every confirmation must itself be confirmed: the last message can always be lost, and its sender does not know. In practice we accept a residual risk (timeouts, resends) instead of aiming for certainty.',
      ko: 'Wrong. More round trips move the doubt without removing it: whoever sends the last message never knows whether it arrived. No finite number of messages guarantees agreement.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Deux navires doivent lever l'ancre ensemble, sinon le premier parti tombe seul sur les pirates. Le capitaine du Nord envoie une chaloupe : « départ à minuit ». Elle arrive ; le Sud renvoie une chaloupe de confirmation, qui arrive aussi. Les chaloupes peuvent couler sans laisser de trace. Quel capitaine a encore une raison de douter que l'autre parte ?",
      o: ['Le Sud, qui ignore si sa chaloupe est arrivée', "Le Nord, qui ignore si le Sud a bien reçu l'heure", 'Aucun : deux chaloupes arrivées suffisent', "Les deux, qui ignorent si l'heure est arrivée", 'Le Nord, qui ignore si le Sud a répondu'],
      ok: "Correct! Le Nord a reçu la confirmation : il sait que le Sud a l'heure. Mais le Sud ne sait pas que sa confirmation est arrivée ; si elle avait coulé, le Nord, prudent, ne partirait pas. Le doute a changé de camp, il n'a pas disparu.",
      ko: "Erreur. Le Nord a reçu la confirmation, il sait donc que le Sud a l'heure. C'est le Sud qui doute : sa chaloupe a pu couler, et rien ne le lui apprend.",
    },
    en: {
      q: 'Two ships must weigh anchor together, or the first to leave meets the pirates alone. The northern captain sends a rowboat: “leave at midnight”. It arrives; the southern ship sends back a confirmation rowboat, which arrives too. Rowboats can sink without a trace. Which captain still has a reason to doubt the other will leave?',
      o: ['South, who does not know its boat arrived', 'North, who does not know South got the time', 'Neither: two rowboats that arrived are enough', 'Both, who do not know the time arrived', 'North, who does not know South replied'],
      ok: 'Correct! North got the confirmation: it knows South has the time. But South does not know its confirmation arrived; had it sunk, a careful North would not leave. The doubt changed sides, it did not go away.',
      ko: 'Wrong. North received the confirmation, so it knows South has the time. South is the one in doubt: its rowboat could have sunk, and nothing tells it.',
    },
  },
  {
    // ordered scale: never shuffle
    correct: [3],
    fr: {
      q: 'Une balise de détresse envoie la même alerte quatre fois, par une liaison radio qui perd un message sur deux, chaque perte étant indépendante des autres. Quelle est la probabilité qu’aucune copie n’arrive ?',
      o: ['1/2', '1/4', '1/8', '1/16', '0 : quatre copies garantissent l’arrivée'],
      ok: 'Correct! (1/2)⁴ = 1/16. Chaque copie de plus divise le risque par deux sans jamais l’annuler : c’est l’idée des renvois de TCP, une probabilité, pas une certitude.',
      ko: 'Erreur. Il faut que les quatre copies se perdent toutes : 1/2 × 1/2 × 1/2 × 1/2 = 1/16. Le risque baisse vite, mais n’atteint jamais zéro.',
    },
    en: {
      q: 'A distress beacon sends the same alert four times over a radio link that loses one message in two, each loss independent of the others. What is the probability that no copy arrives?',
      o: ['1/2', '1/4', '1/8', '1/16', '0: four copies guarantee delivery'],
      ok: 'Correct! (1/2)⁴ = 1/16. Each extra copy halves the risk without ever cancelling it: that is the idea behind TCP resends, a probability, not a certainty.',
      ko: 'Wrong. All four copies must be lost: 1/2 × 1/2 × 1/2 × 1/2 = 1/16. The risk drops fast but never reaches zero.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Deux bases militaires partagent une clé secrète convenue à l'avance et scellent chaque ordre d'un HMAC calculé avec elle. Un ennemi guette les messagers sur la route. Contre quoi le HMAC les protège-t-il ?",
      o: ['Contre la perte des ordres en chemin', "Contre un faux ordre fabriqué par l'ennemi", "Contre la lecture des ordres par l'ennemi", 'Contre le retard des messagers sur la route', "Contre un vieil ordre renvoyé plus tard par l'ennemi"],
      ok: "Correct! Sans la clé, l'ennemi ne peut pas produire un sceau valide : son faux ordre est rejeté. Le HMAC ne chiffre rien (l'ordre reste lisible), ne ramène pas un messager capturé, et un vrai ordre renvoyé plus tard passerait encore : contre le rejeu, il faut un numéro ou une date.",
      ko: "Erreur. Le HMAC prouve l'intégrité et l'origine (quelqu'un qui a la clé) : il bloque le faux ordre. Il ne chiffre pas, ne garantit pas la livraison, et seul il n'empêche pas le rejeu d'un vrai ordre capturé.",
    },
    en: {
      q: 'Two military bases share a secret key agreed in advance and seal every order with an HMAC computed with it. An enemy lies in wait for messengers on the road. What does the HMAC protect them against?',
      o: ['Orders being lost on the way', 'A fake order made by the enemy', 'The enemy reading the orders', 'Messengers being delayed on the road', 'An old order re-sent later by the enemy'],
      ok: 'Correct! Without the key, the enemy cannot produce a valid seal: the forgery is rejected. HMAC encrypts nothing (the order stays readable), does not bring back a captured messenger, and a real order re-sent later would still pass: replay needs a number or a date.',
      ko: 'Wrong. HMAC proves integrity and origin (someone holding the key): it stops the forged order. It does not encrypt, does not guarantee delivery, and on its own does not stop the replay of a real captured order.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un ingénieur affirme : « Mon protocole garantit que deux machines s'accordent même si le réseau perd des messages : il suffit d'enchaîner huit accusés de réception. » Quel argument le réfute ?",
      o: ['Huit ne suffisent pas, il faudrait au moins seize accusés', 'Les accusés de réception ne servent que dans TCP', 'Le réseau peut aussi modifier les messages en chemin', 'Un accusé ne peut pas confirmer un autre accusé', "Le huitième peut se perdre, à l'insu de l'envoyeur"],
      ok: "Correct! Si le huitième accusé se perd, son expéditeur ne le sait pas. Si l'accord tient quand même sans lui, il était inutile, et l'argument recommence avec sept. Aucune longueur de chaîne n'y échappe.",
      ko: "Erreur. Le nombre n'y change rien : le dernier accusé peut toujours se perdre sans que son expéditeur le sache. Seize accusés laisseraient le même doute sur le seizième.",
    },
    en: {
      q: 'An engineer claims: “My protocol guarantees two machines agree even if the network loses messages: just chain eight acknowledgements.” Which argument refutes it?',
      o: ['Eight is not enough, it would take at least sixteen acks', 'Acknowledgements only work inside TCP', 'The network can also alter messages on the way', 'An ack cannot confirm another ack', 'The eighth can be lost without its sender knowing'],
      ok: 'Correct! If the eighth ack is lost, its sender does not know. If agreement holds without it anyway, it was useless, and the argument starts again with seven. No chain length escapes it.',
      ko: 'Wrong. The count changes nothing: the last ack can always be lost without its sender knowing. Sixteen acks would leave the same doubt about the sixteenth.',
    },
  },
  {
    correct: [0, 3],
    fr: {
      q: "Un service de paiement envoie « débiter 50 € » à une banque, par un réseau qui peut perdre des messages et sur lequel un attaquant peut écrire. Quelles mesures répondent à un problème que ce scénario pose réellement ?",
      o: ["Renvoyer l'ordre numéroté tant qu'aucun accusé ne revient", "Chiffrer l'ordre pour qu'il arrive plus sûrement", 'Supprimer les accusés, pour gagner du temps à chaque envoi', "Sceller l'ordre d'un HMAC à clé partagée", 'Allonger la clé pour que les messages se perdent moins'],
      ok: "Correct! Deux menaces, deux réponses : la perte se traite par des renvois (numérotés, pour que la banque ignore les doublons), la falsification par un sceau HMAC. Chiffrer cacherait le montant, mais ne fait arriver aucun message et ne prouve pas l'origine.",
      ko: "Erreur. La perte ne se règle pas par la cryptographie (chiffrer ou allonger la clé ne fait rien arriver) : elle se règle par des renvois numérotés. La falsification se règle par un HMAC. Supprimer les accusés retire le seul moyen de savoir qu'il faut renvoyer.",
    },
    en: {
      q: 'A payment service sends “debit €50” to a bank over a network that can lose messages and that an attacker can write to. Which measures answer a problem this scenario really raises?',
      o: ['Resend the numbered order until an ack comes back', 'Encrypt the order so that it is more likely to arrive', 'Drop acknowledgements to go faster', 'Seal the order with a shared-key HMAC', 'Use a longer key so fewer messages get lost'],
      ok: 'Correct! Two threats, two answers: loss is handled by resends (numbered, so the bank ignores duplicates), forgery by an HMAC seal. Encryption would hide the amount, but makes no message arrive and proves no origin.',
      ko: 'Wrong. Loss is not solved by cryptography (encrypting or a longer key delivers nothing): it is solved by numbered resends. Forgery is solved by an HMAC. Dropping acks removes the only way to know a resend is needed.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Deux équipes de pompiers doivent ouvrir leurs lances au même moment, sinon l'équipe seule est prise par le feu. Elles se parlent par une radio qui perd des messages, et suivent la règle « j'ouvre si j'ai reçu au moins un message de l'autre ». L'équipe Nord envoie l'heure, qui arrive ; l'équipe Sud renvoie un accusé, qui se perd. Que se passe-t-il à l'heure dite ?",
      o: ['Les deux équipes ouvrent ensemble', "Le Nord ouvre seul, le Sud attend", 'Le Sud ouvre seul, le Nord attend', "Aucune n'ouvre, le feu continue", 'Le Sud attend un second accusé, puis ouvre'],
      ok: "Correct! Le Sud a reçu un message, l'heure : sa règle le fait ouvrir. Le Nord n'a rien reçu : il attend. Toute règle fondée sur un nombre de messages a un scénario où le dernier se perd et où une seule équipe agit.",
      ko: "Erreur. Appliquez la règle à chaque équipe : le Sud a reçu un message (l'heure), il ouvre ; le Nord n'en a reçu aucun (l'accusé s'est perdu), il attend. Le Sud ouvre seul.",
    },
    en: {
      q: 'Two fire crews must open their hoses at the same moment, or the crew acting alone is caught by the fire. They talk over a radio that loses messages, and follow the rule “I open if I received at least one message from the other”. North sends the time, which arrives; South sends an ack, which is lost. What happens at the set time?',
      o: ['Both crews open together', 'North opens alone, South waits', 'South opens alone, North waits', 'Neither opens, the fire goes on', 'South waits for a second ack, then opens'],
      ok: 'Correct! South received one message, the time: its rule makes it open. North received nothing: it waits. Any rule based on a count of messages has a scenario where the last one is lost and only one crew acts.',
      ko: 'Wrong. Apply the rule to each crew: South received one message (the time), it opens; North received none (the ack was lost), it waits. South opens alone.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un accord certain est impossible sur un canal qui perd des messages. Pourtant, des millions de connexions TCP s'ouvrent chaque seconde sur Internet, qui perd des paquets. Comment TCP s'en sort-il ?",
      o: ['Il détecte les pertes grâce au chiffrement', 'Il envoie chaque paquet par deux chemins différents', 'Il ne s’en sort pas : Internet ne perd aucun paquet', 'Il prouve mathématiquement que l’accord a bien été atteint', 'Il accepte un doute résiduel, réduit par des renvois'],
      ok: "Correct! TCP n'élimine pas le doute : il numérote, confirme, renvoie après un délai, et abandonne si rien ne revient. La poignée de main en trois messages laisse un risque minime, accepté. La certitude reste impossible.",
      ko: "Erreur. Internet perd bien des paquets, et TCP ne prouve rien : il réduit le risque (numéros de séquence, ACK, renvois après délai) jusqu'à le rendre négligeable, sans jamais l'annuler.",
    },
    en: {
      q: 'Certain agreement is impossible over a channel that loses messages. Yet millions of TCP connections open every second over the Internet, which loses packets. How does TCP cope?',
      o: ['It detects losses thanks to encryption', 'It sends every packet over two different paths', 'It does not need to: the Internet loses no packets', 'It proves mathematically that agreement is reached', 'It accepts a residual doubt, reduced by resends'],
      ok: 'Correct! TCP does not remove the doubt: it numbers, acknowledges, resends after a timeout, and gives up if nothing comes back. The three-message handshake leaves a tiny risk, accepted. Certainty stays impossible.',
      ko: 'Wrong. The Internet does lose packets, and TCP proves nothing: it reduces the risk (sequence numbers, ACKs, resends after timeouts) until it is negligible, without ever cancelling it.',
    },
  },
];
