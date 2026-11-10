(*---
description: Evaluates a random set expression, seed 262, number 5260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8144 \in DOMAIN (CHOOSE f \in [2..1 -> {}] : TRUE) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b8144] = [a |-> b8144, b |-> FALSE])} \cup (((2147483647 + 3) .. Head(<<3, 1, 2>>)) \ DOMAIN [[x \in 1..2 |-> x] EXCEPT ![2] = 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05260 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
