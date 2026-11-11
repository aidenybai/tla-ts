(*---
description: Evaluates a random int expression, seed 262, number 2572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((SUBSET {1} \cup {})) * (IF FALSE THEN -1 ELSE -1 \div (CHOOSE b4050 \in [a |-> 1, b |-> TRUE] : TRUE))) % (Len(SelectSeq(<<>>, LAMBDA e : e > 0)) % (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02572 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 86 to line 14, col 130 of module random_02572
---*)
