(*---
description: Evaluates a random record expression, seed 262, number 5704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality((SUBSET {1} \cap {})), b |-> (\E b8778 \in {0, 1..3} : (2 \in {x \in 1..3 : x > 1}))] EXCEPT !.a = @ + Head(SubSeq([3 EXCEPT ![1] = 2147483647], (1 \div 7), [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05704 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    0
---*)
