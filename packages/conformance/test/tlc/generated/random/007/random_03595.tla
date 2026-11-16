(*---
description: Evaluates a random set expression, seed 262, number 3595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b5669 \in DOMAIN [[a |-> 1, b |-> TRUE] EXCEPT ![1] = 7] : ({b5670 \in {1, 2} : TRUE} = DOMAIN [x \in 1..2 |-> x])}, {(CASE FALSE -> 1 [] OTHER -> 0 * {-1, 0}), (Head(<<1>>) * (CHOOSE b5671 \in Nat : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03595 failed.
    Attempted to access record by a non-string argument: 1
---*)
