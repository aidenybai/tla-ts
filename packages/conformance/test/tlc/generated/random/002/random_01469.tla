(*---
description: Evaluates a random set expression, seed 262, number 1469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<5, 6>> EXCEPT ![-1] = 2147483647] EXCEPT ![Cardinality(SUBSET {1})] = (1 - 1)] \ UNION {DOMAIN (1 :> 2), ({} \ SUBSET {1})}) \cup ({LET b2345 == b2344 IN b2344 : b2344 \in {3, 1}} \cap UNION {UNION {{1}, Nat}, UNION {{}, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_01469
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01469 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
