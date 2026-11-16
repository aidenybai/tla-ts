(*---
description: Evaluates a random record expression, seed 262, number 3705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = Len(<<1, 2>>)] \o <<(-1), IF TRUE THEN 2 ELSE -1>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 54 of module random_03705
    | 2
---*)
