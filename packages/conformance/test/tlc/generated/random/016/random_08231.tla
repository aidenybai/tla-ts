(*---
description: Evaluates a random set expression, seed 262, number 8231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([SubSeq(<<>>, 1, -1) EXCEPT ![1] = ([a |-> 1]).a]), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 40 of module random_08231
    | {0, 1}
---*)
