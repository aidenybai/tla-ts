(*---
description: Evaluates a random int expression, seed 262, number 3656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((([a |-> 1, b |-> TRUE]).a % Head(<<1, 2>>)) + ((2147483647 :> 1))[Len(<<>>)]), (CASE (FALSE => FALSE) -> (0 % 3) [] OTHER -> Cardinality({}) + CASE (TRUE => FALSE) -> ([a |-> 1]).a [] OTHER -> ([a |-> 1, b |-> TRUE]).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03656 failed.
    Attempted to apply function:
    (2147483647 :> 1)
    to argument 0, which is not in the domain of the function.
---*)
