(*---
description: Evaluates a random set expression, seed 262, number 4507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([((1 :> 2) @@ <<5, 6>>) EXCEPT ![Cardinality({2, 1, 3})] = (CHOOSE b7081 \in 2..1 : FALSE)] @@ (IF TRUE THEN 2147483647 ELSE -1 :> ({} \cap 1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 45 of module random_04507
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04507 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    2147483647
---*)
