(*---
description: Evaluates a random bool expression, seed 262, number 477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b789 \in ({([a |-> 1]).a, LET b790 == <<>> IN 1} \cup (UNION {{x \in 1..3 : x > 1}, Nat} \cup {7, 2147483647})) : ((SubSeq(<<>>, b789, 2147483647) \o [<<>> EXCEPT ![1] = -1]) = LET b791 == UNION {{2, 1, 3}, Nat} IN (<<5, 6>>)[b789])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00477 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2, 3}
---*)
