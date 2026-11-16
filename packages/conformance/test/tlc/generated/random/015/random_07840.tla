(*---
description: Evaluates a random seq expression, seed 262, number 7840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(([Append(<<1, 2>>, 1) EXCEPT ![1] = (0 + 2147483647)] \o Append(<<7, 3>>, (-1 \div 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07840 failed.
    2179:0 The second argument of \div is 0.
---*)
