(*---
description: Evaluates a random int expression, seed 262, number 8862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<([a |-> 1]).a, Len(<<1>>)>>, Len([[a |-> 1] EXCEPT !.a = 0])) % (([<<5, 6>> EXCEPT ![<<>>] = 7])[(-7)] * ((7 :> 1))[IF FALSE THEN [x \in Nat |-> x + 1] ELSE -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08862 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 0]
---*)
