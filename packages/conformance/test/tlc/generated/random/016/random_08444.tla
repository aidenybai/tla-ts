(*---
description: Evaluates a random record expression, seed 262, number 8444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (3 = [a |-> 1, b |-> TRUE]) -> (1 + 2) [] OTHER -> Len(<<3, 1, 2>>), b |-> ([[a |-> 1] EXCEPT !.a = @ + 0] = [[a |-> 1] EXCEPT !.a = [x \in 1..2 |-> x]])] EXCEPT !.a = @ + ((([a |-> 1]).a - Head(<<1>>)) \div (-([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08444 failed.
    Attempted to check equality of integer 3 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
