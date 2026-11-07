(*---
description: Evaluates a random set expression, seed 262, number 1112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{Head((<<>> \o <<>>)), ((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[(3 + 7)]}, UNION {DOMAIN (7 :> 7), DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = -1]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
