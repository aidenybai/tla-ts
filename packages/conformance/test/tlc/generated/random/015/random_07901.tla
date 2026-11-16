(*---
description: Evaluates a random bool expression, seed 262, number 7901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((FALSE \/ TRUE) => (1..3 \subseteq SUBSET {1})) THEN Head(<<3, -1>>) ELSE (((1 :> 2) @@ FALSE))[Cardinality({x \in 1..3 : x > 1})] = (CASE (1 < 1) -> (2147483647 + 2147483647) [] OTHER -> (CHOOSE b12194 \in {1, 2} : TRUE) \div Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07901 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
