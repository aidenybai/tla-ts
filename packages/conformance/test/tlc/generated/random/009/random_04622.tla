(*---
description: Evaluates a random int expression, seed 262, number 4622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([[a |-> 7, b |-> FALSE] EXCEPT !.a = Head(<<>>)] = (CHOOSE r \in [a : {1}] : TRUE)) -> ((([a |-> 1, b |-> TRUE] :> 0) @@ (\A b7234 \in {1, 2} : TRUE)))[Cardinality({b7235 : b7235 \in 1..3})] [] OTHER -> LET b7236 == Head((~FALSE)) IN CASE SortSeq(<<1>>, LAMBDA p, q : p < q) -> Head(<<3, 1, 2>>) [] OTHER -> (-b7236))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
