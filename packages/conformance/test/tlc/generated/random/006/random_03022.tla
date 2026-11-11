(*---
description: Evaluates a random set expression, seed 262, number 3022.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(UNION {({1} \cup [x \in Nat |-> x + 1]), UNION {{1}, SUBSET {1}}} \cup (DOMAIN (1 :> 2) \cap UNION {{1}, Nat})), ({b4807 \in ({1, 2} \ {x \in 1..3 : x > 1}) : ((1 :> 2))[b4807]} \ (UNION {<<1>>, SUBSET {1}} \cap [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03022 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
