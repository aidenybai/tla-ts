(*---
description: Evaluates a random int expression, seed 262, number 7280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11211 \in ({b11212 \in ([a |-> 1] \cap {1, 2}) : ({2, 1, 3} = {1})} \cup (CHOOSE r \in [a : 2..1] : TRUE)) : ((IF TRUE THEN b11211 ELSE b11211 = (-0)) <=> ((TRUE => FALSE) <=> ({2, 1, 3} = 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07280 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
