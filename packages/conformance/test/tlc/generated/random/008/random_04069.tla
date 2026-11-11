(*---
description: Evaluates a random function expression, seed 262, number 4069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((0 \div 2147483647) :> Head(<<>>)) @@ (Cardinality(SUBSET {1}) :> (-1 - 3))) EXCEPT ![([b6405 \in {3, 2} |-> (-2147483647)])[Head(Tail(<<3, 1, 2>>))]] = (((2 * 2) - (2147483647 % 2)) - IF (TRUE /\ TRUE) THEN ((1 :> 2) % 2147483647) ELSE Head(TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04069 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
