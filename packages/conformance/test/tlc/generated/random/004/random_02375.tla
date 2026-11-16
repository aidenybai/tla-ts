(*---
description: Evaluates a random int expression, seed 262, number 2375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b3761 \in ([x \in Nat |-> x + 1] \cap {1}) : [a |-> 7, b |-> TRUE]}) \div ([b3762 \in ({1, 2} \cup {2, 1, 3}) |-> (CHOOSE b3763 \in Nat : TRUE)])[LET b3764 == (<<5, 6>>)[3] IN LET b3765 == b3764 IN <<1, 2>>]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02375 failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 56 to line 14, col 60 of module random_02375>]
---*)
