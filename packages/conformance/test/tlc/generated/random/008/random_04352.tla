(*---
description: Evaluates a random int expression, seed 262, number 4352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({} \subseteq {1}) -> (CHOOSE b6858 \in SUBSET {1} : TRUE) [] OTHER -> Cardinality({2, 1, 3}) - Cardinality({2147483647, 0})) - Head(((0 :> 3) @@ [[x \in 1..2 |-> x] EXCEPT ![0] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 170 to line 14, col 187 of module random_04352
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04352 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    (0 :> 3 @@ 1 :> 1 @@ 2 :> 2)
---*)
