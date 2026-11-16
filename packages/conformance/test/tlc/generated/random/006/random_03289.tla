(*---
description: Evaluates a random seq expression, seed 262, number 3289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<LET b5229 == LET b5230 == 0 IN -1 IN ([a |-> 1]).a, (CHOOSE b5231 \in {b5232 : b5232 \in FALSE} : (Nat \subseteq 1..3))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03289 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 115 to line 14, col 119 of module random_03289
---*)
