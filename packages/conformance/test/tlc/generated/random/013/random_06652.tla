(*---
description: Evaluates a random set expression, seed 262, number 6652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((TRUE <=> TRUE) => (<<3, 1, 2>> = (1 :> 2))) -> IF (~FALSE) THEN ((1 :> 2) @@ [x \in Nat |-> x + 1]) ELSE Cardinality(1..3) [] OTHER -> LET b10204 == IF FALSE THEN -1 ELSE 2147483647 IN Cardinality({2, 1, 3}) .. Head(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (CHOOSE b10205 \in {1, 2} : TRUE), Cardinality(SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06652 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
