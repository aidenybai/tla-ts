(*---
description: Evaluates a random function expression, seed 262, number 9744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15131 \in (IF (2147483647 \in [a |-> 1, b |-> TRUE]) THEN Cardinality(1..3) ELSE (-1 * 3) .. Len((<<3, 1, 2>> \o <<>>))) |-> (IF (b15131 < 3) THEN IF TRUE THEN 0 ELSE b15131 ELSE Cardinality({}) % ((b15131 * 1) + (b15131 - b15131)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09744 failed.
    Attempted to check if element:
    2147483647
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
