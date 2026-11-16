(*---
description: Evaluates a random record expression, seed 262, number 6048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({1, 2} \cup {}) \cap ({1} \ SUBSET {1})) \cup {([x \in Nat |-> x + 1] - b9318) : b9318 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]}), Len(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06048 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
