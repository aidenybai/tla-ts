(*---
description: Evaluates a random seq expression, seed 262, number 8016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq([<<3, 1>> EXCEPT ![1] = (0 * 1)], CASE (\A b12366 \in {1} : FALSE) -> (1 \div 2) [] OTHER -> (-1 + 0), (-Cardinality(2..1))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08016 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<0, 1>>
    , but instead it is
    -1
---*)
