(*---
description: Evaluates a random set expression, seed 262, number 4884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (([a |-> 2, b |-> TRUE]).a :> IF ([a |-> 1] = (1 :> 2)) THEN (3 + 3) ELSE Cardinality([x \in 1..2 |-> x])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04884 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<2>>
---*)
