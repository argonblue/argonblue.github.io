---
title: "Learning logic: notation and axioms"
mathjax: true
---
I've been getting back into teaching myself mathematical logic.
It's been an interest of mine for a long time (maybe as far back as elementary school), and it keeps coming up in some of my programming pursuits.

Right now, I'm working my way through two "introductory" texts: Stephen Cole Kleene's *Mathematical Logic* and Joel W. Robbin's *Mathematical Logic: a first course*.
I'm also reading parts of the massive website of the [Metamath](http://us.metamath.org/) project.

## Notation

I'll probably update the notation on this page as I make progress.
Right now it only really covers propositional calculus, and some related metalogic.
I'll probably need to update it to include predicate calculus, etc.

Unfortunately, there's a lot of variation in notations for mathematical logic.
It does make going back and forth between different texts somewhat frustrating.
I'm going to attempt to consistently use the following in my blog, regardless of what a given text uses.
This is largely the notation that Wikipedia articles about mathematical logic tend to use, [for example](https://en.wikipedia.org/wiki/Propositional_calculus).

Capital latin letters, typically from the beginning of the alphabet $(A, B, C, \ldots)$ are metavariables for well-formed formulas (wff).
Lowercase latin letters, typically from the middle of the alphabet $(p, q, r, \ldots)$ are proposition letters in the object language.

### Logical operators or connectives

|symbol|alternatives|meaning|
|------|------------|-------|
| $$\neg$$  | $$\sim, !$$ | not |
| $$\to$$   | $$\Rightarrow, \supset$$ | implies |
| $$\land$$ | $$\cap, {\mathbf \&} $$ | and |
| $$\lor$$  | $$\cup, {\mathbf v} $$ | or |
| $$\leftrightarrow$$ |$$\Leftrightarrow, \equiv$$ | if and only if |
| $$\top$$  | $${\mathfrak t}, {\mathbf T}, 1$$ | true |
| $$\bot$$  | $${\mathfrak f}, {\mathbf F}, 0$$ | false |

### Metalogical symbols

|symbol|meaning|
|------|-------|
| $$A \equiv B$$ | $A$ is defined as $B$ |
| $$A_1, \ldots A_n \vdash B $$ | $B$ is deducible from $A_1, \ldots A_n$ |
| $$A_1, \ldots A_n \vDash B $$ | $B$ is a logical consequence of $$A_1, \ldots A_n$$ |
| $${A, (A \to B)} \over B$$ | given $A$ and $(A \to B)$, infer $B$ |

## Differences

Different authors choose different axiom schemas for propositional calculus.
It seems like these axiom schemas are all equivalent, except when they're specifically chosen to demonstrate some restricted subset of propositional calculus.
I'll probably have more to say about that in a future post.

### Robbin

Robbin's "system P" uses $\to$ and $\bot$ as primitive, defining an abbreviation

$$\neg A \equiv (A \to \bot)$$

for logical negation.

The axiom schemas are

$$
\begin{align*}
A &\to (B \to A) \\
(A \to (B \to C)) &\to ((A \to B) \to (A \to C)) \\
\neg \neg A &\to A
\end{align*}
$$

The third axiom is really an abbreviation for

$$
((A \to \bot) \to \bot) \to A
$$

The single rule of inference is *modus ponens*:

$$
{A, (A \to B)} \over B
$$

Other connectives are defined in terms of the primitives, instead of additional axioms:

$$
\begin{align*}
(A \lor B) &\equiv (\neg A \to B) \\
(A \land B) &\equiv \neg (\neg A \lor \neg B) \\
(A \leftrightarrow B) &\equiv ((A \to B) \land (B \to A))
\end{align*}
$$

Amusingly enough, this definition of $\land$ directly embeds one of [DeMorgan's Laws](https://en.wikipedia.org/wiki/De_Morgan's_laws).

### Kleene

Kleene takes a larger set of connectives as primitive: $\lbrace \neg, \to, \leftrightarrow, \land, \lor \rbrace$, and uses a much larger set of axioms.
He does claim that by use of definitions, the axioms can be limited to

$$
\begin{align*}
A &\to (B \to A) \\
(A \to B) &\to ((A \to (B \to C)) \to (A \to C)) \\
(A \to B) &\to ((A \to \neg B) \to \neg A) \\
\neg \neg A &\to A
\end{align*}
$$

The single rule of inference is *modus ponens*.
I suspect that double negation (the fourth axiom) is actually deducible from the first three, but haven't proven it myself yet.

### Metamath
[Metamath](http://us.metamath.org/mpeuni/mmset.html#scaxioms) uses an axiom system by Jan Łukasiewicz, popularized by Alonzo Church as System ${\mathrm P}_2$.

$$
\begin{align*}
A &\to (B \to A) \\
(A \to (B \to C)) &\to ((A \to B) \to (A \to C)) \\
(\neg A \to \neg B) &\to (B \to A)
\end{align*}
$$

The rule of inference is *modus ponens*.
I think Metamath uses other rules of inference in its full proof database, but tries to avoid using them when proving theorems about propositional calculus.

## References

* Kleene, Stephen Cole. *Mathematical Logic*. New York: Wiley, 1967.
* Robbin, Joel W. *Mathematical Logic: A First Course*. New York: W. A. Benjamin, 1969.
