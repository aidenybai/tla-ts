(*---
description: Evaluates a random record expression, seed 262, number 5490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (TRUE /\ FALSE) -> (2 - -1) [] OTHER -> Head(<<>>), b |-> ((TRUE \/ TRUE) /\ (TRUE <=> FALSE))] EXCEPT !.a = LET b8491 == ((1 :> 3))[Len(FALSE)] IN (Len(<<3, 1, 2>>) * Cardinality({1, 2}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
