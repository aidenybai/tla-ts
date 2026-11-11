(*---
description: Evaluates a random bool expression, seed 262, number 9737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]) \cup {b15118 \in ({1} \cup TRUE) : (FALSE \/ TRUE)}) \subseteq ({[a |-> 2147483647, b |-> FALSE] : b15119 \in ({2, 1, 3} \cup {1, 2})} \ ((2 .. 0) \cap DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09737 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    TRUE
    are not both enumerable
---*)
