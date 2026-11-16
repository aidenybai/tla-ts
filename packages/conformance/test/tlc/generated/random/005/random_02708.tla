(*---
description: Evaluates a random set expression, seed 262, number 2708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4281 \in {Len([a |-> <<1>>, b |-> TRUE]), (Head(<<1>>) * ([a |-> 1, b |-> TRUE] * 2147483647))} : (SelectSeq((<<1>> \o <<>>), LAMBDA e : e > 0) => ((2147483647 = SUBSET {1}) /\ (TRUE \/ TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02708 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> <<1>>, b |-> TRUE]
---*)
