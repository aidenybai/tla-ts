(*---
description: Evaluates a random int expression, seed 262, number 379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b624 \in {((2 :> 1))[(7 - 7)], IF (2 \in 2..1) THEN (1 + 3) ELSE (0 .. [a |-> 1, b |-> TRUE])} : LET b625 == IF (b624 \in 2..1) THEN CASE FALSE -> b624 [] OTHER -> 2 ELSE ([x \in Nat |-> x + 1])[1] IN (([a |-> 1]).a :> Len(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00379 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument 0, which is not in the domain of the function.
---*)
