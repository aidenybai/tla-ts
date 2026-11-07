(*---
description: Evaluates a random record expression, seed 262, number 9324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({b14464 \in (2..1 \cap SUBSET {1}) : (b14464 \in Nat)}), b |-> (LET b14465 == Head(<<>>) IN (-b14465) \in {IF TRUE THEN b14466 ELSE b14466 : b14466 \in {1, 0}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
