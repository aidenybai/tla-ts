(*---
description: Evaluates a random function expression, seed 262, number 3204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[x \in 1..2 |-> x] EXCEPT ![-1] = 2147483647] EXCEPT ![(TRUE => TRUE)] = CASE FALSE -> -1 [] OTHER -> 1] :> (-(CHOOSE b5091 \in {2, 1, 3} : TRUE))) @@ [[b5092 \in ({x \in 1..3 : x > 1} \cup SUBSET {1}) |-> IF TRUE THEN b5092 ELSE b5092] EXCEPT ![Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))] = ((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))[(-1 % 1)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_03204
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03204 failed.
    Attempted to apply function with integer domain to the non-integer argument TRUE
---*)
