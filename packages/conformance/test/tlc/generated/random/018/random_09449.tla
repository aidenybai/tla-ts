(*---
description: Evaluates a random set expression, seed 262, number 9449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b14665 \in DOMAIN (1 :> 2) |-> (7 % b14665)] \ UNION {{Head(<<>>), (CHOOSE f \in [1..2 -> 2..1] : TRUE)}, {(-7), ((1 :> 2))[3]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
