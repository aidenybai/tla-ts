(*---
description: Evaluates a random function expression, seed 262, number 9443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14656 \in UNION {UNION {2..1, {1, 2}}, {7, 3}} |-> Len([<<1, 2>> EXCEPT ![1] = 1])] @@ [((CHOOSE b14657 \in {x \in 1..3 : x > 1} : FALSE) :> CASE TRUE -> 0 [] OTHER -> 7) EXCEPT ![(Head(<<3, 1, 2>>) * (2147483647 + -1))] = Cardinality(DOMAIN [x \in Nat |-> x + 1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09443 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 109 to line 14, col 154 of module random_09443
---*)
