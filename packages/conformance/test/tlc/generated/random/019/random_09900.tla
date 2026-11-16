(*---
description: Evaluates a random record expression, seed 262, number 9900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b15394 \in (2147483647 \ {2, 1, 3}) |-> (1 * 2)])[Cardinality({2147483647, -1})], b |-> ((UNION {{}, {x \in 1..3 : x > 1}} = {b15395 \in SUBSET {1} : TRUE}) <=> ([(1 :> 2) EXCEPT !.a = 0] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09900 failed.
    Attempted to check if the value:
    2
    is an element of the integer 2147483647
---*)
