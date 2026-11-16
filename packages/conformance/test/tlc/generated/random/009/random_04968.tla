(*---
description: Evaluates a random function expression, seed 262, number 4968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<>>) * (2147483647 => TRUE)) \in {b7739 \in DOMAIN (1 :> 2) : (b7739 < -1)}) @@ (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04968 failed.
    Attempted to evaluate an expression of form P => Q when P was
    an integer.
    line 14, col 32 to line 14, col 49 of module random_04968
---*)
