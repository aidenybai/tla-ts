(*---
description: Evaluates a random set expression, seed 262, number 2919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Append(SortSeq(<<>>, LAMBDA p, q : p < q), (-1 * 2147483647)), (Len(<<1>>) % CASE TRUE -> 2 [] OTHER -> 1), ((1 * 2147483647)).a) = [b4613 \in {(<<5, 6>>)[b4614] : b4614 \in DOMAIN [x \in Nat |-> x + 1]} |-> (Cardinality({1, 2}) \div (CHOOSE f \in [{1} -> 1..2] : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02919 failed.
    Attempted to select field "a" from a non-record value 2147483647
    line 14, col 132 to line 14, col 151 of module random_02919
---*)
