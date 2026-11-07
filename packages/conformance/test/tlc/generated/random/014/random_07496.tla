(*---
description: Evaluates a random record expression, seed 262, number 7496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head(SelectSeq(<<>>, LAMBDA e : e > 0)) \ {Cardinality({1}) : b11548 \in DOMAIN <<5, 6>>}), {b11549 \in {(-1), Cardinality(1..3)} : (\E b11550 \in UNION {{1}, Nat} : (<<>> = <<5, 6>>))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
