(*---
description: Evaluates a random bool expression, seed 262, number 8049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((2147483647 :> 3))[CASE FALSE -> 2147483647 [] OTHER -> -1]) < ((([x \in Nat |-> x + 1])[0] * (7 % 0)) % IF (TRUE => FALSE) THEN (-<<1, 2>>) ELSE (CHOOSE b12429 \in {1} : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08049 failed.
    Attempted to apply function:
    (2147483647 :> 3)
    to argument -1, which is not in the domain of the function.
---*)
