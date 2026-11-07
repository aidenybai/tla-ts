(*---
description: Evaluates a random record expression, seed 262, number 3761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> [a |-> 7, b |-> TRUE], b |-> ([a |-> 1, b |-> TRUE] < 1)]).a .. (IF (FALSE \/ FALSE) THEN Cardinality({}) ELSE (FALSE \/ TRUE) + Head(SubSeq(<<1>>, 1, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
