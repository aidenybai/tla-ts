(*---
description: Evaluates a random record expression, seed 262, number 6477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [[a |-> 2, b |-> TRUE] EXCEPT !.a = @ + (-2)], b |-> ([b9965 \in [a |-> 1, b |-> TRUE] |-> b9965])[(-1 = 7)]] EXCEPT !.a = @ + (Head(SelectSeq(<<>>, LAMBDA e : e > 0)) - Len(SubSeq(<<3, 1, 2>>, 2147483647, 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06477 failed.
    Attempted to check if element:
    FALSE
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
