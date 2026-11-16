(*---
description: Evaluates a random int expression, seed 262, number 5814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail([a |-> IF FALSE THEN 7 ELSE 2147483647, b |-> (~TRUE)]), SubSeq(Tail((<<>> \o <<>>)), ((-3) * ([a |-> 1]).a), (IF TRUE THEN 2 ELSE -1 - (3 - 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05814 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 2147483647, b |-> FALSE]
---*)
