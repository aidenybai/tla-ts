(*---
description: Evaluates a random int expression, seed 262, number 3768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((CHOOSE b5945 \in SUBSET {1} : TRUE) .. (3 % -1)), UNION {({} \cup 2147483647), {b5946 : b5946 \in SUBSET {1}}}} = {(-((1 :> 2))[1]), SortSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03768 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
