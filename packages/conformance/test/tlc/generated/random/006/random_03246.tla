(*---
description: Evaluates a random bool expression, seed 262, number 3246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b5161 \in ((({1} \ {2, 1, 3}) \ {-1, 0}) \cap (LET b5162 == 0 IN 3 .. ([x \in 1..2 |-> x])[-1])) : ({([x \in Nat |-> x + 1])[7] : b5163 \in {b5164 \in {} : TRUE}} \subseteq (Cardinality({1}) \cup UNION {{x \in 1..3 : x > 1}, 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03246 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
