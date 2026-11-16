(*---
description: Evaluates a random int expression, seed 262, number 406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a \div ((CHOOSE r \in [a : 2..1] : TRUE)).a) * (([[x \in Nat |-> x + 1] EXCEPT ![-1] = 0] @@ ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x])))[{Cardinality({1, 2}) : b664 \in (Nat \cap Nat)}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00406 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 99 of module random_00406
---*)
