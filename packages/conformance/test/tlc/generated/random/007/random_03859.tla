(*---
description: Evaluates a random record expression, seed 262, number 3859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. 3) \ (2..1 \cup Nat)) \cap {LET b6078 == 2 IN b6078, Len(<<1>>)}) \subseteq {([b6079 \in Nat |-> b6079])[Cardinality(2..1)], ((<<1, 2>>).a + (1 + 7))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03859 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
