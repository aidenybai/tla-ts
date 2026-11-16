(*---
description: Evaluates a random int expression, seed 262, number 2695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = [b4265 \in {1} |-> b4265]) \/ ((~<<1>>) /\ (TRUE => TRUE))) -> (([a |-> 3, b |-> TRUE]).a - (Cardinality(Nat) % (<<5, 6>> * 2))) [] OTHER -> Head(SelectSeq(<<0, [a |-> 1, b |-> TRUE]>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02695 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 96 to line 14, col 101 of module random_02695
---*)
