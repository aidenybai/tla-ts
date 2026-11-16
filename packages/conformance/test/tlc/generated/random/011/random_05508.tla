(*---
description: Evaluates a random int expression, seed 262, number 5508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Len(<<>>)), Len(Append(<<1, 2>>, 1))} - (-(([x \in 1..2 |-> x])[TRUE] % (3 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05508 failed.
    Attempted to check if the value:
    TRUE
    is in the integer interval 1..2
---*)
