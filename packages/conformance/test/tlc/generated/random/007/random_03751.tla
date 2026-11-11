(*---
description: Evaluates a random seq expression, seed 262, number 3751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(<<(-7), (CHOOSE b5913 \in {1, 2} : [a |-> 1])>>, (LET b5914 == 2 IN 1 * (3 + 2147483647)), (CHOOSE b5915 \in {b5916 \in {} : FALSE} : (\A b5917 \in {} : FALSE))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03751 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 40 to line 14, col 74 of module random_03751
---*)
