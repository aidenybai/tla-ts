(*---
description: Evaluates a random function expression, seed 262, number 7434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([x \in Nat |-> x + 1])[-1] = (2 - 2147483647)) THEN ((<<5, 6>>)[1] * (-2147483647)) ELSE (CHOOSE b11462 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] : (b11462 :> b11462)) :> CASE (~(FALSE /\ TRUE)) -> (([x \in 1..2 |-> x])[7] \div IF TRUE THEN 1 ELSE 2) [] OTHER -> (Cardinality({}) % CASE FALSE -> 2147483647 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07434 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 37 to line 14, col 41 of module random_07434>],
    the first argument is:
    -1
    which is not in its domain.
---*)
