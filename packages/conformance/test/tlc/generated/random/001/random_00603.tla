(*---
description: Evaluates a random set expression, seed 262, number 603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({IF TRUE THEN 1 ELSE 2 : b1011 \in ({1} \cup [a |-> 1])}), ({IF TRUE THEN 7 ELSE 3, ([x \in Nat |-> x + 1])[FALSE]} \subseteq {([a |-> 1, b |-> TRUE]).a : b1012 \in {b1013 \in {x \in 1..3 : x > 1} : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00603 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    [a |-> 1]
    are not both enumerable
---*)
