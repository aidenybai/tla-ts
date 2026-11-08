(*---
description: Evaluates a random function expression, seed 262, number 8859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(TRUE <=> FALSE)) <=> ((1 + -1) = Cardinality(<<1, 2>>))) :> (IF (~FALSE) THEN (0 - -1) ELSE Cardinality({}) * ((7 \div 1) % Cardinality(FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08859 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
