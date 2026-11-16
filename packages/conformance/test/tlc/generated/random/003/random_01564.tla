(*---
description: Evaluates a random function expression, seed 262, number 1564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{} -> 2..1] : TRUE) EXCEPT ![UNION {(1..3 \cap {1}), ({} \ 2..1)}] = [a |-> (CHOOSE b2499 \in Nat : FALSE), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])]] @@ (Cardinality({1 : b2500 \in 0}) :> ((-1 + 2147483647) + (CHOOSE b2501 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 50 of module random_01564
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01564 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    0
---*)
