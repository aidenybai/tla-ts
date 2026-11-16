(*---
description: Evaluates a random set expression, seed 262, number 8378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Tail(<<3, 1, 2>>)) % (CHOOSE b12962 \in (SUBSET {1} \ 2..1) : (b12962 = 2))) .. ((Cardinality({1}) % (Nat \cap 1..3)) * ((3 - 0) + {b12963 : b12963 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08378 failed.
    Attempted to check equality of the set {} with the value:
    2
---*)
