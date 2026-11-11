(*---
description: Evaluates a random record expression, seed 262, number 6852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((SUBSET {1} \ {2, 1, 3}) = {b10506 \in [x \in 1..2 |-> x] : {x \in 1..3 : x > 1}}) THEN ((0 :> 7))[(-2147483647)] ELSE Len([<<>> EXCEPT ![1] = 2147483647]), b |-> (((\A b10507 \in {2, 1, 3} : TRUE) => (-1 \in Nat)) => ((2147483647 = 0) => (\A b10508 \in {2, 1, 3} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06852 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
