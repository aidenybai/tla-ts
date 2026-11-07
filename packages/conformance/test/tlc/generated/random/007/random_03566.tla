(*---
description: Evaluates a random seq expression, seed 262, number 3566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) \o Tail([FALSE EXCEPT ![1] = 2147483647])) EXCEPT ![1] = (CHOOSE r \in [a : 2..1] : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03566 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
