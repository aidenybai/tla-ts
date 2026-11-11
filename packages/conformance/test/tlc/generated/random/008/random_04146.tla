(*---
description: Evaluates a random set expression, seed 262, number 4146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(LET b6532 == (1..3 * [a |-> 1]) IN Head(<<1, 2>>) % Cardinality((SUBSET {1} \cap {1, 2}))), (CHOOSE r \in [a : 2..1] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04146 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
