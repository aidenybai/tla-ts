(*---
description: Evaluates a random bool expression, seed 262, number 4657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 3 ELSE -1 .. CASE TRUE -> -1 [] OTHER -> 7) = ((CHOOSE b7282 \in {x \in 1..3 : x > 1} : FALSE) .. Cardinality({1, 2}))) \/ (Cardinality({2147483647, 1}) = Len((Nat .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04657 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 125 of module random_04657
---*)
