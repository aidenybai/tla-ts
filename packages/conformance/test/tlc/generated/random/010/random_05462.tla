(*---
description: Evaluates a random function expression, seed 262, number 5462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8453 \in (DOMAIN (~TRUE) \ ({b8454 : b8454 \in Nat} \cup ({1, 2} \ {}))) |-> Cardinality({(1 \div 7), LET b8455 == b8453 IN b8455})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05462 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 28 to line 14, col 41 of module random_05462
---*)
