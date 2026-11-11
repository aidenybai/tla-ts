(*---
description: Evaluates a random int expression, seed 262, number 6192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9534 \in (([x \in Nat |-> x + 1])[0] .. (-0)) |-> {(CHOOSE b9536 \in 1..3 : TRUE) : b9535 \in ({1, 2} \cap 2..1)}])[Len(<<(CHOOSE b9537 \in 1..3 : FALSE), (CHOOSE b9538 \in {2, 1, 3} : TRUE)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06192 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 142 to line 14, col 170 of module random_06192
---*)
