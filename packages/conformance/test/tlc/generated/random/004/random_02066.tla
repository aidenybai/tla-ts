(*---
description: Evaluates a random seq expression, seed 262, number 2066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(<<2, 7>>) \o [[<<>> EXCEPT ![1] = -1] EXCEPT ![1] = (1 - 1)]) \o SelectSeq(SelectSeq(Tail([x \in 1..2 |-> x]), LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 41 of module random_02066
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 59 of module random_02066
    | <<7, 2>>
---*)
