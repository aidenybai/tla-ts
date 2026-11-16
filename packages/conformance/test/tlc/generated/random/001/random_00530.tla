(*---
description: Evaluates a random record expression, seed 262, number 530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((2147483647 \div 1) % (3 - 7)), b |-> ((-1 * 2147483647) < Head(<<>>))] EXCEPT !.a = @ + (-([FALSE EXCEPT !.a = @ + 3]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00530 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -4
---*)
