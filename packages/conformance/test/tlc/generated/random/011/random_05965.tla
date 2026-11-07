(*---
description: Evaluates a random record expression, seed 262, number 5965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (<<5, 6>>)[1], b |-> ([a |-> 1] = [a |-> 1])] EXCEPT !.a = @ + Head(Append(<<3, 1, 2>>, -1))] EXCEPT !.a = Head(Tail(Tail(0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
---*)
