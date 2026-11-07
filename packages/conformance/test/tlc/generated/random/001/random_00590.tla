(*---
description: Evaluates a random record expression, seed 262, number 590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality({7 : b988 \in {1}}) :> ([a |-> 1, b |-> TRUE]).a), b |-> (\E b989 \in (Cardinality({1, 2}) \cup ({1, 2} \cap Nat)) : (([a |-> 1] \cup {2, 1, 3}) \subseteq ([x \in 1..2 |-> x] \cup {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00590 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    2
    are not both enumerable
---*)
