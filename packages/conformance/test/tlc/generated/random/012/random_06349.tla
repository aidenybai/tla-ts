(*---
description: Evaluates a random set expression, seed 262, number 6349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> 1 [] OTHER -> 3, b |-> (<<>> = 2147483647)] EXCEPT !.a = @ + (-(2147483647 * 3))] EXCEPT !.a = @ + ([a |-> ([a |-> 1]).a, b |-> (<<3, 1, 2>> = <<5, 6>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06349 failed.
    Attempted to check equality of the function <<>> with the value:
    2147483647
---*)
