(*---
description: Evaluates a random bool expression, seed 262, number 2709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 \in {2, 1, 3}) <=> (~TRUE)) <=> (CASE TRUE -> -1 [] OTHER -> -1 = {b4282 \in {1} : FALSE})) /\ (~((<<>> = <<5, 6>>) \/ (1 < 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02709 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 18 to line 14, col 111 of module random_02709
---*)
