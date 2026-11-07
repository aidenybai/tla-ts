(*---
description: Evaluates a random int expression, seed 262, number 4738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7405 \in ({b7406 \in {1, 0} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} \cap UNION {DOMAIN [x \in Nat |-> x + 1], {0, 1}}) : (Head(<<b7405, b7405>>) = ((b7405 * b7405) - ((1 :> 2))[1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04738 failed.
    Attempted to compare the set {0, 1} with the value:
    Nat
---*)
