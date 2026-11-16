(*---
description: Evaluates a random bool expression, seed 262, number 1778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [<<>> EXCEPT ![2147483647] = 1] = ({1 : b2813 \in SUBSET {1}} \cap (2 .. 2147483647))) <=> ((([a |-> 1, b |-> TRUE]).a * (<<5, 6>>)[3]) = (CASE FALSE -> 7 [] OTHER -> 7 % Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 29 of module random_01778
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01778 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
