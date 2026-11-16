(*---
description: Evaluates a random seq expression, seed 262, number 7399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(IF ({x \in 1..3 : x > 1} = {2, 1, 3}) THEN ([a |-> 1, b |-> TRUE]).a ELSE ((1 :> 2))[3] * IF (2 = -1) THEN (7 % 1) ELSE (7 % 3)), (IF (TRUE /\ TRUE) THEN (-1) ELSE (1 + -1) + ([a |-> 0, b |-> TRUE]).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07399 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
