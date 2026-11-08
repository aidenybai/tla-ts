(*---
description: Evaluates a random int expression, seed 262, number 3509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> CASE TRUE -> 3 [] OTHER -> 2, b |-> (TRUE /\ TRUE)] EXCEPT !.a = Head(SelectSeq(<<>>, LAMBDA e : e > 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03509 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
