(*---
description: Evaluates a random function expression, seed 262, number 3640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) :> ((-1 % 2) \div Head(<<1, 2>>))) EXCEPT ![(([a |-> 2, b |-> FALSE]).a * (Head(0) + (7 - 2)))] = LET b5752 == CASE (TRUE => FALSE) -> (-2) [] OTHER -> (CHOOSE b5753 \in Nat : TRUE) IN Head([<<3, 1, 2>> EXCEPT ![1] = b5752])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)
