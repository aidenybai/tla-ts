(*---
description: Evaluates a random bool expression, seed 262, number 7419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<>>) - LET b11429 == 0 IN -1) - ((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE))[UNION {{1, 2}, {1, 2}}]) = ([(CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) EXCEPT ![(2 - 2)] = SelectSeq(<<1, 2>>, LAMBDA e : e > 0)])[Cardinality((1 .. 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07419 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
