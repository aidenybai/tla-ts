(*---
description: Evaluates a random int expression, seed 262, number 9396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(CASE ((3 + 2) < ([x \in Nat |-> x + 1])[2147483647]) -> ((7 + 2147483647) - IF FALSE THEN 2147483647 ELSE {1}) [] OTHER -> CASE (0 = 1) -> ([x \in 1..2 |-> x])[[x \in 1..2 |-> x]] [] OTHER -> (CHOOSE b14582 \in {2, 1, 3} : FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09396 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
