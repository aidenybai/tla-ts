(*---
description: Evaluates a random bool expression, seed 262, number 4469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7030 \in {b7031 \in (CASE FALSE -> 3 [] OTHER -> 0 < (3 + 3)) : (([a |-> 1, b |-> TRUE]).a \in UNION {{2, 1, 3}, {1, 2}})} : (DOMAIN (b7030 :> -1) = {b7032 \in DOMAIN [x \in 1..2 |-> x] : (<<3, 1, 2>> = (1 :> 2))})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04469 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    TRUE
    is not enumerable
---*)
