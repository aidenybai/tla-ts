(*---
description: Evaluates a random set expression, seed 262, number 8195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(DOMAIN [[x \in 1..2 |-> x] EXCEPT ![b12674] = 3]) : b12674 \in DOMAIN ((1 :> 3) @@ [[x \in 1..2 |-> x] EXCEPT ![FALSE] = 2])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08195 failed.
    Attempted to apply function with integer domain to the non-integer argument FALSE
---*)
