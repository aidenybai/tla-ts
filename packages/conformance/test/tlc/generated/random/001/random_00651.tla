(*---
description: Evaluates a random int expression, seed 262, number 651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-CASE (Head(TRUE) \in (1..3 \cup 2)) -> (Head(<<1>>) \div IF FALSE THEN -1 ELSE -1) [] OTHER -> Head([<<1, 2>> EXCEPT ![1] = 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00651 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
---*)
