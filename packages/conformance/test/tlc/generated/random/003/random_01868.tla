(*---
description: Evaluates a random set expression, seed 262, number 1868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{((SUBSET {1} \cap {1}) = [a |-> 2, b |-> FALSE]), ((0 < 3) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1]))}, {Head((<<1, 2>> \o <<>>)), ((TRUE).a - CASE TRUE -> 1 [] OTHER -> 0)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01868 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
