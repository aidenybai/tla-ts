(*---
description: Evaluates a random set expression, seed 262, number 753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((-([a |-> 1]).a) :> LET b1235 == ([x \in Nat |-> x + 1])[0] IN (CHOOSE b1236 \in 1..3 : FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00753 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 88 to line 14, col 116 of module random_00753
---*)
