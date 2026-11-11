(*---
description: Evaluates a random int expression, seed 262, number 5142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((-3) \div IF -1 THEN 7 ELSE 7)) + (Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) + ((-3) % (2 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05142 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 30 to line 14, col 48 of module random_05142
---*)
