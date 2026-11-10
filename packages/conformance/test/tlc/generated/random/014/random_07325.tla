(*---
description: Evaluates a random seq expression, seed 262, number 7325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(((({} = [a |-> 1, b |-> TRUE]) <=> (~FALSE)) \o <<IF TRUE THEN 0 ELSE 7, CASE TRUE -> [x \in Nat |-> x + 1] [] OTHER -> -1>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07325 failed.
    Attempted to check equality of the set {} with the value:
    [a |-> 1, b |-> TRUE]
---*)
