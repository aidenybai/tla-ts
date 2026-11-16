(*---
description: Evaluates a random set expression, seed 262, number 2989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (~(FALSE \subseteq 1..3)) THEN (CHOOSE b4746 \in UNION {{x \in 1..3 : x > 1}, 1..3} : (\A b4747 \in {1, 2} : FALSE)) ELSE LET b4748 == IF TRUE THEN 2 ELSE 0 IN ([a |-> 1]).a .. Head(SortSeq(<<2147483647, 0>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02989 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 23 to line 14, col 42 of module random_02989
---*)
