(*---
description: Evaluates a random bool expression, seed 262, number 9930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(2..1 \ {2, 1, 3}), UNION {Nat, {x \in 1..3 : x > 1}}} = (\A b15448 \in ({1} \cap 1..3) : (b15448 \in Nat))) \/ (Append(Tail(<<1>>), LET b15449 == 1 IN b15449) = [b15450 \in Cardinality([a |-> 1, b |-> TRUE]) |-> ([x \in Nat |-> x + 1])[7]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09930 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
