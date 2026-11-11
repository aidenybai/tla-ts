(*---
description: Evaluates a random int expression, seed 262, number 1606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(Len(<<1>>)) % (((1 :> 2) @@ <<5, 6>>))[(2147483647 \div 2147483647)]) - Cardinality({b2563 \in (SUBSET {1} \cup {1}) : ({x \in 1..3 : x > 1} \subseteq 2..1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01606 failed.
    2181:0 Attempted to compute cardinality of the value
    1
---*)
