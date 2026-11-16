(*---
description: Evaluates a random seq expression, seed 262, number 3408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<(SUBSET {1} \subseteq {1, 2}), Cardinality(SUBSET {1})>>) EXCEPT ![1] = (((-1 :> 0))[CASE FALSE -> 3 [] OTHER -> -1] + IF (\A b5410 \in 1..3 : FALSE) THEN LET b5411 == 2147483647 IN 2 ELSE Cardinality({2, 1, 3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03408 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
