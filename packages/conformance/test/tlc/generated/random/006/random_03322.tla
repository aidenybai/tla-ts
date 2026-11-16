(*---
description: Evaluates a random record expression, seed 262, number 3322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = Cardinality(({[a |-> 1, b |-> TRUE], 2147483647} \cup {2147483647, 7}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03322 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    7
---*)
