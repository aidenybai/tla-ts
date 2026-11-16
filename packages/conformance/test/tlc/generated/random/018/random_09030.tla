(*---
description: Evaluates a random int expression, seed 262, number 9030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE)[7] * (2147483647 % 0)) * ((2147483647 \div 1) * (CHOOSE b14029 \in {1, 2} : FALSE))) - Head(Tail((<<>> \o <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09030 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 19 to line 14, col 28 of module random_09030
---*)
