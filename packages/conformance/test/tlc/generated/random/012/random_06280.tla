(*---
description: Evaluates a random int expression, seed 262, number 6280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9663 \in {b9664 \in (Cardinality(2..1) .. (-0)) : ((<<>> \in 0) <=> (TRUE => TRUE))} : (SortSeq(<<SUBSET {1}, -1>>, LAMBDA p, q : p < q) = ((b9663 + 1) :> LET b9665 == 0 IN b9665))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06280 failed.
    Attempted to check if the value:
    <<>>
    is an element of the integer 0
---*)
