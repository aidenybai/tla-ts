(*---
description: Evaluates a random seq expression, seed 262, number 1949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3070 \in {(CHOOSE r \in [a : 1..2] : TRUE), Head((CHOOSE b3071 \in {2, 1, 3} : TRUE))} : Append(<<(CHOOSE b3072 \in {} : TRUE), ([a |-> 1, b |-> TRUE]).a>>, IF (\E b3073 \in 2..1 : FALSE) THEN CASE TRUE -> 7 [] OTHER -> 3 ELSE (b3070 % 2147483647))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01949 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
---*)
