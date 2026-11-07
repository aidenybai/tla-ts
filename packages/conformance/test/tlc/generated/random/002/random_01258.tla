(*---
description: Evaluates a random bool expression, seed 262, number 1258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b2008 \in (Cardinality({b2009 \in 2..1 : TRUE}) .. (-Cardinality(Nat))) : ((IF TRUE THEN b2008 ELSE b2008 + IF FALSE THEN {1, 2} ELSE b2008) :> (Cardinality(FALSE) + (TRUE).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
