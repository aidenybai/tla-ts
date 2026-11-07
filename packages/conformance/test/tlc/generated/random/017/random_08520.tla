(*---
description: Evaluates a random int expression, seed 262, number 8520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13200 \in {Head([<<3, 1, 2>> EXCEPT ![1] = 1]), IF (TRUE \/ FALSE) THEN Head(<<>>) ELSE (3 - 0)} : (((b13200 % 7) \in ({1, 2} \cap b13200)) <=> ([[a |-> 1] EXCEPT !.a = 2147483647] = (CHOOSE r \in [a : 1..2] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
