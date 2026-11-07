(*---
description: Evaluates a random function expression, seed 262, number 6690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10261 \in (DOMAIN (-1 :> SUBSET {1}) \ {b10262 \in {b10263 \in 2..1 : TRUE} : (TRUE <=> TRUE)}) |-> (((-0) - (-b10261)) + Head(Tail(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
