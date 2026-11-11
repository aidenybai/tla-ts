(*---
description: Evaluates a random seq expression, seed 262, number 5149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b7995 \in ({b7996 \in 2..1 : TRUE} \ (1 .. 0)) : ({-1 : b7997 \in {2, 1, 3}} = ({2, 1, 3} \cap {2, 1, 3}))} \ DOMAIN [(2147483647 :> 2147483647) EXCEPT ![Len(<<3, 1, 2>>)] = ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 137 to line 14, col 160 of module random_05149
    | {}
---*)
