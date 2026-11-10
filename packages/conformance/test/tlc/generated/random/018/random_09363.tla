(*---
description: Evaluates a random int expression, seed 262, number 9363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-(CHOOSE b14534 \in (FALSE \cap TRUE) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09363 failed.
    Attempted to enumerate S \cap T when neither S:
    FALSE
    nor T:
    TRUE
    is enumerable
---*)
