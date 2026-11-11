(*---
description: Evaluates a random function expression, seed 262, number 110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((FALSE => TRUE) <=> (1..3 \subseteq [a |-> 1])) -> Cardinality((2147483647 .. 1)) [] OTHER -> (([a |-> 1, b |-> TRUE]).a + (2147483647 - [a |-> 1, b |-> TRUE])) :> (((2 + 0) + ([a |-> 1, b |-> TRUE]).a) + CASE (~FALSE) -> (3 + 1) [] OTHER -> (-2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00110 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
