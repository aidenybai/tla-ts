(*---
description: Evaluates a random record expression, seed 262, number 2088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SubSeq(Tail(<<3, 1, 2>>), LET b3325 == 7 IN b3325, Len(<<1>>)) EXCEPT !.a = @ + ((3 + 7) \div Head(<<3, 1, 2>>))] EXCEPT !.a = @ + ([[b3326 \in [a |-> 1] |-> b3326] EXCEPT ![(-1 - 7)] = [<<5, 6>> EXCEPT ![2147483647] = 2147483647]])[(Head(<<1, 2>>) * (2147483647 + 7))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02088 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
