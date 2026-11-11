(*---
description: Evaluates a random set expression, seed 262, number 9646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [b14981 \in {b14982 \in {1} : FALSE} |-> (3 % b14981)], ([(CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) EXCEPT ![CASE TRUE -> 3 [] OTHER -> 1] = Head(<<1>>)] .. ((<<5, 6>>)[7] * (2 % 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 89 to line 14, col 126 of module random_09646
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09646 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
