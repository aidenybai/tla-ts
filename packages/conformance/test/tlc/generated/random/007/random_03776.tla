(*---
description: Evaluates a random record expression, seed 262, number 3776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + (2147483647 % 3)] EXCEPT !.a = Head(SubSeq(<<3, 1, 2>>, 3, 2147483647))] EXCEPT !.a = @ + (-LET b5962 == Head(<<3, 1, 2>>) IN LET b5963 == b5962 IN 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03776 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
