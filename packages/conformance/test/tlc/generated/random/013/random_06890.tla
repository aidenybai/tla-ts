(*---
description: Evaluates a random set expression, seed 262, number 6890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append([<<>> EXCEPT ![1] = 7], Len(<<1, 2>>)), ([a |-> 2147483647, b |-> TRUE] = [[a |-> 1] EXCEPT !.a = @ + 2]))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 39 of module random_06890
    | 2
---*)
