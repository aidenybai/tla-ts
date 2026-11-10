(*---
description: Evaluates a random set expression, seed 262, number 2874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((TRUE \/ FALSE) => (~TRUE)) -> (CHOOSE b4554 \in UNION {{2, 1, 3}, 1..3} : ({1, 2} = {1, 2})) [] OTHER -> ([b4555 \in SUBSET {1} |-> 7])[(1 + 0)], ([b4556 \in {7 : b4557 \in {2, 1, 3}} |-> (b4556 + b4556)])[IF [a |-> 2, b |-> TRUE] THEN ([a |-> 1] \div 1) ELSE (1 % -1)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02874 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
