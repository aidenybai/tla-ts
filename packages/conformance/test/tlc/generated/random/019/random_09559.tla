(*---
description: Evaluates a random set expression, seed 262, number 9559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[(3 :> -1) EXCEPT ![Len(<<1>>)] = ([a |-> 1, b |-> TRUE]).a] EXCEPT ![((-7) - LET b14845 == 7 IN b14845)] = (-<<1, <<1, 2>>>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 32 of module random_09559
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 83 of module random_09559
    | {3}
---*)
