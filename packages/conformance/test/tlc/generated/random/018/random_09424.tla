(*---
description: Evaluates a random seq expression, seed 262, number 9424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (<<5, 6>>)[1] [] OTHER -> (-0), Cardinality({b14619 : b14619 \in {1, 2}})>> \o SortSeq([UNION {2..1, 1..3} EXCEPT ![1] = UNION {{1, 2}, Nat}], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09424 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
