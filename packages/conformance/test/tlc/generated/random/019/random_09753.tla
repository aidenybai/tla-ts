(*---
description: Evaluates a random set expression, seed 262, number 9753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(3 + 7)) .. (CHOOSE b15136 \in DOMAIN [x \in Nat |-> x + 1] : (\A b15137 \in {1} : FALSE))) \ (DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) \cup DOMAIN Tail(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09753 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 33 to line 14, col 108 of module random_09753
---*)
