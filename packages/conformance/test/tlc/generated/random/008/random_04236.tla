(*---
description: Evaluates a random bool expression, seed 262, number 4236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (2 = 3) THEN (<<5, 6>>)[3] ELSE SelectSeq(<<1>>, LAMBDA e : e > 0) = Cardinality({0, 7})) /\ (((TRUE \subseteq {1}) \/ ([a |-> 1] = [a |-> 1])) /\ (\E b6662 \in {b6663 \in {1} : [a |-> 1, b |-> TRUE]} : (FALSE => TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04236 failed.
    Attempted to check equality of the function <<1>> with the value:
    2
---*)
