(*---
description: Evaluates a random record expression, seed 262, number 165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ([a |-> 1, b |-> TRUE])[1], b |-> (<<1>> = <<5, 6>>)] EXCEPT !.a = Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] EXCEPT !.a = @ + (Cardinality((SUBSET {1} \cap {x \in 1..3 : x > 1})) - ((-0) * (2 * 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00165 failed.
    Attempted to access record by a non-string argument: 1
---*)
