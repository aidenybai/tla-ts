(*---
description: Evaluates a random seq expression, seed 262, number 231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a>>, LET b377 == Cardinality(DOMAIN [x \in 1..2 |-> x]) IN Len(Tail(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00231 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
