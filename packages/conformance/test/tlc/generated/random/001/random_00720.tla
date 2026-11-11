(*---
description: Evaluates a random int expression, seed 262, number 720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([IF (\E b1186 \in SUBSET {1} : TRUE) THEN IF TRUE THEN 1 ELSE 2147483647 ELSE Len(<<1>>) EXCEPT !.a = @ + Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00720 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
