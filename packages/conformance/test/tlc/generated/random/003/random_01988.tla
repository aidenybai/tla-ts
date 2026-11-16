(*---
description: Evaluates a random seq expression, seed 262, number 1988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<LET b3151 == 1 IN 1, (-3)>> EXCEPT ![1] = {Cardinality(SUBSET {1}), CASE FALSE -> 2147483647 [] OTHER -> 2}] \o ([Append(TRUE, 0) EXCEPT ![1] = LET b3152 == 2147483647 IN 7] \o ([<<3, 1, 2>> EXCEPT ![1] = -1] \o SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01988 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    TRUE
---*)
