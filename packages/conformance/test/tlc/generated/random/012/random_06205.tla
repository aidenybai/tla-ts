(*---
description: Evaluates a random seq expression, seed 262, number 6205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(Tail(<<>>), LAMBDA p, q : p < q), IF (2 \in <<5, 6>>) THEN (CHOOSE b9555 \in Nat : TRUE) ELSE (CHOOSE b9556 \in SUBSET {1} : FALSE)) \o <<Head([<<>> EXCEPT ![1] = 0]), (Cardinality(Nat) + Cardinality(Nat))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06205 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
