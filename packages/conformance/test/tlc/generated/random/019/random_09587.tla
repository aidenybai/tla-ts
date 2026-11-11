(*---
description: Evaluates a random bool expression, seed 262, number 9587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((CASE TRUE -> 2 [] OTHER -> -1 \in DOMAIN (1 :> 2)) <=> (([a |-> 1]).a < (1 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09587 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 19 to line 14, col 99 of module random_09587
---*)
