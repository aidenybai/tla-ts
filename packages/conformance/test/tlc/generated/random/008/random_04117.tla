(*---
description: Evaluates a random record expression, seed 262, number 4117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (SortSeq(SubSeq(<<3, 1, 2>>, -1, -1), LAMBDA p, q : p < q) * (CHOOSE b6468 \in (1..3 \cap 1..3) : (\A b6469 \in {2, 1, 3} : FALSE))), b |-> (((3 + 2) .. (-2147483647)) \subseteq (([a |-> 1, b |-> TRUE] .. -1) \cap UNION {{x \in 1..3 : x > 1}, 7}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04117 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
