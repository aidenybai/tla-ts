(*---
description: Evaluates a random function expression, seed 262, number 1549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2469 \in Tail([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b2470 \in 2..1 : 1)]) |-> Cardinality(((b2469 % 2) :> (7 * b2469)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01549 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 86 to line 14, col 110 of module random_01549
---*)
