(*---
description: Evaluates a random set expression, seed 262, number 7437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 2147483647, b |-> FALSE]).a + (CHOOSE b11465 \in {2147483647, 1} : (<<1>> = [x \in 1..2 |-> x]))) .. (CHOOSE b11466 \in UNION {({2, 1, 3} \ 1..3), DOMAIN [x \in Nat |-> x + 1]} : ((\A b11467 \in {1} : <<>>) => (7 \in {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07437 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 57 to line 14, col 120 of module random_07437
---*)
