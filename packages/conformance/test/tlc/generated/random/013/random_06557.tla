(*---
description: Evaluates a random function expression, seed 262, number 6557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10078 \in DOMAIN (2 :> 2) |-> (([x \in 1..2 |-> x])[b10078] % Cardinality({1}))] EXCEPT ![(Head((3 .. -1)) % Tail(<<3, 0>>))] = Len(Tail(Append(<<>>, 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06557 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
