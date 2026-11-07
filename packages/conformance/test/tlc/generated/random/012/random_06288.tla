(*---
description: Evaluates a random seq expression, seed 262, number 6288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((((2147483647 - 7) .. ([a |-> 1]).a) \cup UNION {UNION {{2, 1, 3}, 2..1}, ({2, 1, 3} \ SUBSET {1})}), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06288 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
