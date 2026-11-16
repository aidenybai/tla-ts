(*---
description: Evaluates a random int expression, seed 262, number 2049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((([a |-> 1]).a * ({1} \subseteq <<1, 2>>)) * (Head(<<1, 2>>) * IF FALSE THEN -1 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02049 failed.
    Attempted to check set membership in a tuple value.
---*)
