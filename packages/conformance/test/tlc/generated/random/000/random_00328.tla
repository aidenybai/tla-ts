(*---
description: Evaluates a random int expression, seed 262, number 328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b551 \in ((-1 % 1) .. IF TRUE THEN 1 ELSE 3) |-> IF (b551 < -1) THEN IF 2 THEN -1 ELSE b551 ELSE LET b552 == 3 IN 2147483647])[([(CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(2 - -1)] = (-7)])[(CHOOSE b553 \in {2147483647 : b554 \in <<5, 6>>} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 148 to line 14, col 192 of module random_00328
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00328 failed.
    TLC encountered a non-enumerable quantifier bound
    <<5, 6>>.
    line 14, col 263 to line 14, col 270 of module random_00328
---*)
