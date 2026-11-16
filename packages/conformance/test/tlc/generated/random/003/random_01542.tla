(*---
description: Evaluates a random function expression, seed 262, number 1542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE <<1>> -> 2 [] OTHER -> 7 \div CASE TRUE -> 1 [] OTHER -> 7) :> IF (~TRUE) THEN [a |-> 2, b |-> FALSE] ELSE Cardinality(Nat)) @@ [b2452 \in {(CHOOSE b2454 \in SUBSET {1} : FALSE) : b2453 \in (0 .. 2147483647)} |-> (-(CHOOSE b2455 \in 2..1 : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01542 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 24 to line 14, col 28 of module random_01542
---*)
