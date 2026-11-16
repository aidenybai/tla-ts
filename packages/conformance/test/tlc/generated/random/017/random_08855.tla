(*---
description: Evaluates a random record expression, seed 262, number 8855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = (2 * 7)]).a, b |-> (((1 % -1) < ([a |-> 1]).a) => (SubSeq(<<3, 1, 2>>, 2147483647, 7) = (0 :> 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08855 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
