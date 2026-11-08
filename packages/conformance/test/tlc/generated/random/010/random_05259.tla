(*---
description: Evaluates a random record expression, seed 262, number 5259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<>>) * IF FALSE THEN 1 ELSE 7) \div ([b8142 \in {2, 1, 3} |-> 0])[Cardinality({1})]), b |-> (SortSeq(SubSeq(<<1>>, 7, -1), LAMBDA p, q : p < q) = [b8143 \in UNION {<<1>>, {1, 2}} |-> CASE FALSE -> 1 [] OTHER -> b8143])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05259 failed.
    2179:0 The second argument of \div is 0.
---*)
