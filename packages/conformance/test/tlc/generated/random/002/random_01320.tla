(*---
description: Evaluates a random set expression, seed 262, number 1320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b2102 == LET b2103 == (1 * 3) IN (CHOOSE b2104 \in 1..3 : FALSE) IN ([[x \in Nat |-> x + 1] EXCEPT ![3] = b2102] @@ [b2105 \in {} |-> -1]), (CHOOSE b2106 \in {(3 - 1), (2 % 0)} : (\E b2107 \in (2..1 \ {x \in 1..3 : x > 1}) : (<<1, 2>> = [a |-> 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01320 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 55 to line 14, col 83 of module random_01320
---*)
