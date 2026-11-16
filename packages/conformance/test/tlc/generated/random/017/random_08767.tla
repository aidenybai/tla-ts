(*---
description: Evaluates a random record expression, seed 262, number 8767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Tail(Append(<<3, 1, 2>>, 7)), b |-> SelectSeq(Tail(<<>>), LAMBDA e : e > 0)] EXCEPT !.a = @ + Cardinality(({b13576 : b13576 \in 2..1} \cup DOMAIN <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08767 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
