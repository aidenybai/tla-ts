(*---
description: Evaluates a random set expression, seed 262, number 6821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(7 .. 7), {2, 1}} \cap (DOMAIN <<5, 6>> \cup {7, 2})) \cup (DOMAIN (SUBSET {1} :> 2) \cap ((-7) .. (-1 - 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06821 failed.
    Attempted to check if the value:
    {{}, {1}}
    is in the integer interval -7..-3
---*)
