(*---
description: Evaluates a random int expression, seed 262, number 6042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9305 == (LET b9306 == (7 % 2147483647) IN Cardinality(Nat) * ((2 \div 0) * LET b9307 == 7 IN b9307)) IN Head((~([a |-> 1] = [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
