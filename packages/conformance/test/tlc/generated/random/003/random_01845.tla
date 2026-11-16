(*---
description: Evaluates a random int expression, seed 262, number 1845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({1, 3} = ({1, 2} \ {1})) THEN (Head(<<1>>) \in DOMAIN <<3, 1, 2>>) ELSE (Cardinality(SUBSET {1}) + (0 \div 3)) % ([(<<5, 6>> @@ (1 :> 2)) EXCEPT ![(2147483647 + 2)] = (<<5, 6>>)[2]])[((<<5, 6>>)[7] - (1 % 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01845 failed.
    2178:0 Overflow when computing 2147483647+2
---*)
