(*---
description: Evaluates a random set expression, seed 262, number 6630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((Head(FALSE) % Cardinality({})) .. Cardinality(DOMAIN [x \in Nat |-> x + 1])), (((2..1 \cup {x \in 1..3 : x > 1}) \ {b10183 \in {1} : FALSE}) \ ((-0) .. Cardinality({1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06630 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
