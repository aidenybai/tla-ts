(*---
description: Evaluates a random bool expression, seed 262, number 4219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 1, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = 7]) \/ (([x \in 1..2 |-> x])[1] = LET b6630 == 7 IN 0)) <=> (((CHOOSE f \in [{} -> 2..1] : TRUE))[Len(<<1, 2>>)] \in {({2, 1, 3} \cap SUBSET {1}) : b6631 \in (0 .. -1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04219 failed.
    Attempted to apply function:
    <<>>
    to argument 2, which is not in the domain of the function.
---*)
