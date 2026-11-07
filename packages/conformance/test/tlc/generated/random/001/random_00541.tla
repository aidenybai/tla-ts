(*---
description: Evaluates a random record expression, seed 262, number 541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(DOMAIN (1 :> 2)), b |-> ((-1) = (2147483647 * 1))] EXCEPT !.a = IF (Tail(FALSE) = (<<5, 6>> @@ [x \in Nat |-> x + 1])) THEN (Cardinality(SUBSET {1}) % LET b920 == 1 IN 0) ELSE Cardinality((SUBSET {1} \ {x \in 1..3 : x > 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
