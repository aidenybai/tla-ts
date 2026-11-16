(*---
description: Evaluates a random bool expression, seed 262, number 1098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b1751 \in ((-1 .. -1) \cup ({} \cup Nat)) : ((1..3 \ {x \in 1..3 : x > 1}) \subseteq {-1, 3})} = UNION {((CHOOSE b1752 \in {1} : FALSE) .. (-1 \div [x \in 1..2 |-> x])), (DOMAIN [x \in Nat |-> x + 1] \cup ({x \in 1..3 : x > 1} \ 2..1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01098 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 124 to line 14, col 151 of module random_01098
---*)
