(*---
description: Evaluates a random bool expression, seed 262, number 6296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9683 \in ({(2 - 3), IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 3} \ UNION {{(1 :> 2), -1}, ({1} \cap 2..1)}) : ({(7 * 1), ([a |-> 1]).a} \subseteq {(<<5, 6>>)[1], (-1 % b9683)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06296 failed.
    Attempted to check equality of the function <<2>> with the value:
    -1
---*)
