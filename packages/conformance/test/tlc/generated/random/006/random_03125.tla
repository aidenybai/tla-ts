(*---
description: Evaluates a random seq expression, seed 262, number 3125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> {1, 2}] : TRUE) EXCEPT ![1] = Head(Append(Append(<<>>, 1), [[a |-> 1] EXCEPT !.a = 7]))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 51 of module random_03125
    | <<>>
---*)
