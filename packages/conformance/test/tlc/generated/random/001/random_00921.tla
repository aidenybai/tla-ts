(*---
description: Evaluates a random function expression, seed 262, number 921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1481 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![-1] = 2] : (~(\E b1482 \in SUBSET {1} : FALSE))) :> ((Len({}) - (7 * 3)) * Len((<<3, 1, 2>> \o <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 43 to line 14, col 60 of module random_00921
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00921 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
---*)
