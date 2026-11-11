(*---
description: Evaluates a random seq expression, seed 262, number 3464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((SelectSeq(2147483647, LAMBDA e : e > 0) \o Tail(<<>>)) \o Append([<<3, 1, 2>> EXCEPT ![1] = 0], Len(FALSE))), (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a % (-[a |-> 7, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03464 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    2147483647
---*)
