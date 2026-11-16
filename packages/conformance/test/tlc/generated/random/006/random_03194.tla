(*---
description: Evaluates a random record expression, seed 262, number 3194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ([{1} EXCEPT ![3] = 2147483647] = (<<5, 6>>)[3]) -> ((-1) + (-1 :> 2)) [] OTHER -> (-([x \in 1..2 |-> x])[3]), b |-> ((CASE 2..1 -> 2147483647 [] OTHER -> 2147483647 % ((1 :> 2))[2147483647]) < (-(2147483647 \div FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03194 failed.
    Attempted to apply EXCEPT construct to the value {1}.
---*)
