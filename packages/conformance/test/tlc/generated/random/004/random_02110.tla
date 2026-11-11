(*---
description: Evaluates a random record expression, seed 262, number 2110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (2 + 2)] EXCEPT !.a = ((1 + -1) + (<<5, 6>>)[3])] EXCEPT !.a = @ + ([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = IF TRUE THEN 2147483647 ELSE 2147483647] * (Append(<<1>>, 2147483647)).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02110 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
