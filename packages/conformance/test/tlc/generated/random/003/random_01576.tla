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
