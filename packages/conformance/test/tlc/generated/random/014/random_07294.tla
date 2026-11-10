(*---
description: Evaluates a random seq expression, seed 262, number 7294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq(SubSeq(<<3, 1, 2>>, -1, -1), ([a |-> 1]).a, Cardinality(Nat)) \o (SortSeq(<<1>>, LAMBDA p, q : p < q) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))), CASE ((SUBSET {1} = 1..3) <=> (<<1>> = [x \in 1..2 |-> x])) -> LET b11233 == Len(<<3, 1, 2>>) IN (2147483647 * b11233) [] OTHER -> ([[x \in Nat |-> x + 1] EXCEPT ![0] = 2])[(7 + 1)], Len(<<(2 - -1), Cardinality([a |-> 1, b |-> TRUE])>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07294 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
