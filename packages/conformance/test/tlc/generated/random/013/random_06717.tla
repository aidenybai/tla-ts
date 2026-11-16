(*---
description: Evaluates a random int expression, seed 262, number 6717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE \/ TRUE) THEN Cardinality({x \in 1..3 : x > 1}) ELSE (0 * 2) :> (Len(<<1>>) * ([a |-> 1, b |-> TRUE]).a)))[([a |-> Head(<<1, 2>>), b |-> (\E b10296 \in 2..1 : TRUE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06717 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 195 of module random_06717
---*)
