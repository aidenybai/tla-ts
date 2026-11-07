(*---
description: Evaluates a random record expression, seed 262, number 4315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b6803 == IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (2147483647 + 3) ELSE (CHOOSE b6804 \in {1, 2} : TRUE) IN (-LET b6805 == 7 IN b6805), b |-> ((Tail(<<>>) \o (<<1, 2>> \o [a |-> 1, b |-> TRUE])) = (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
