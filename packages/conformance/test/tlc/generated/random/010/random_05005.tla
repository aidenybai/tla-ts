(*---
description: Evaluates a random seq expression, seed 262, number 5005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<((CHOOSE b7784 \in 2..1 : TRUE) * ([x \in Nat |-> x + 1] * 7)), (CHOOSE b7785 \in (2147483647 \ 2..1) : (2147483647 = 2147483647))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05005 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 52 of module random_05005
---*)
