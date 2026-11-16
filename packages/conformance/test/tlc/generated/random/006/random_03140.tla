(*---
description: Evaluates a random set expression, seed 262, number 3140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x] @@ <<5, 6>>))[[[a |-> 1] EXCEPT !.a = @ + 1]], b |-> ((CHOOSE r \in [a : {1, 2}] : TRUE) = (CHOOSE r \in [a : {}] : TRUE))] EXCEPT !.a = Len(<<IF FALSE THEN 1 ELSE <<5, 6>>, IF FALSE THEN 7 ELSE 0>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03140 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 2]
---*)
