(*---
description: Evaluates a random set expression, seed 262, number 158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b241 \in (LET b242 == 2147483647 IN TRUE .. (2147483647 % 0)) : [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = LET b243 == b241 IN b243]} \cup (DOMAIN (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) \cup {b244 \in (1..3 \ [a |-> 1]) : (\A b245 \in {} : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00158 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
