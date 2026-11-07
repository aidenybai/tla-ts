(*---
description: Evaluates a random bool expression, seed 262, number 1076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(Tail(<<>>), (-1 + -1), (0 % 1)) = ((0 :> 0) @@ (CHOOSE f \in [{} -> 2..1] : TRUE))) => (CASE (FALSE <=> FALSE) -> Head(<<1, 2>>) [] OTHER -> Cardinality(1..3) = (Cardinality(Nat) * ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
