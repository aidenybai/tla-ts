(*---
description: Evaluates a random set expression, seed 262, number 8098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(([[x \in 1..2 |-> x] EXCEPT ![3] = 3])[Cardinality(2..1)] \in ((1 .. 1) \cap ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}))), ({b12505 \in UNION {{2, 1, 3}, {}} : (b12505 < b12505)} \cap ({b12506 \in {2, 1, 3} : FALSE} \cap (2147483647 .. 0)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 43 of module random_08098
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08098 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
