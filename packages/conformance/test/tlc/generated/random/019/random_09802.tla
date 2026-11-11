(*---
description: Evaluates a random seq expression, seed 262, number 9802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SortSeq(<<-1, 7>>, LAMBDA p, q : p < q), CASE (2 \in SUBSET {1}) -> (2 - 7) [] OTHER -> [a |-> 0, b |-> TRUE]) EXCEPT ![1] = Cardinality(DOMAIN [b15208 \in Nat |-> 3])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09802 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
