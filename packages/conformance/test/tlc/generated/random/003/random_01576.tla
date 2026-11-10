(*---
description: Evaluates a random int expression, seed 262, number 1576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 24, col 8 to line 24, col 11 of module random_01576 failed.
      Attempted to compute the value of an expression of form
      CHOOSE x \in S: P, but no element of S satisfied P.
      line 23, col 19 to line 23, col 66 of module random_01576
---*)
---- MODULE random_01576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b2517 \in (7 .. 2147483647) : (1..3 = {})) + CASE (SUBSET {1} \subseteq {1}) -> (SUBSET {1} = 1) [] OTHER -> (TRUE \/ FALSE)) - (((1 * 1) % Cardinality({1, 2})) % IF (TRUE \in 2..1) THEN Cardinality({1, 2}) ELSE Len(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
