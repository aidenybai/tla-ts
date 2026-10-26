---- MODULE Alias ----
EXTENDS Integers, TLC, Sequences, TLCExt

VARIABLES x, y
vars == <<x,y>>

A ==
/\ y' = ~y
/\ x < 4
/\ x' = x + 1

B ==
/\ y' = ~y
/\ x = 4
/\ x' = 1

Next == A \/ B

Spec == x = 1 /\ y = FALSE /\ [][Next]_vars

FairSpec == Spec /\ WF_vars(Next)

Inv == x < 4

Prop == <>(x > 4)

Animation(e1,e2) == "e1: " \o ToString(e1) \o " e2: " \o ToString(e2)

\* An expression that is evaluated on the pair of states
\* s and t and printed in place of s in an error trace.
\* Useful to:
\* - filter out variables (not shown below)
\* - rename variables
\* - map variables (e.g. animation)
\* - additional trace expressions
\* TLC ignores the original state if the evaluation of
\* Alias fails.
Alias == [yy |-> y, \* x and y reordered.
          x |-> x,
          a |-> x' - x,
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          lvl |-> [ i \in {1,2} |-> TLCGet("level")],
          trc |-> Trace]

Tautology == (vars = vars) ~> (vars = vars)

=======================
