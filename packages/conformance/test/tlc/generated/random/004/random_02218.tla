(*---
description: Evaluates a random bool expression, seed 262, number 2218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Append(<<>>, 7))) < {b3493 \in {CASE FALSE -> 0 [] OTHER -> 2, ([a |-> 1, b |-> TRUE]).a} : (([a |-> 1, b |-> TRUE] = [x \in Nat |-> x + 1]) \/ LET b3494 == b3493 IN b3493)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02218 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
