(*---
description: Evaluates a random record expression, seed 262, number 479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({IF TRUE THEN 0 ELSE 1, Head(<<1, 2>>)}), b |-> (((SUBSET {1} \subseteq (1 :> 2)) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1])) = IF (\A b792 \in {1, 2} : TRUE) THEN (-1 \div <<5, 6>>) ELSE (1 - -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00479 failed.
    Attempted to check if the value:
    {}
    is an element of the function <<2>>
---*)
