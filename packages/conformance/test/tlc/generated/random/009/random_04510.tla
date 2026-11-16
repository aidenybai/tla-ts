(*---
description: Evaluates a random set expression, seed 262, number 4510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-7) - (1 \div 7)) .. ([<<5, 6>> EXCEPT ![7] = 7])[(2147483647 % 3)]) \ UNION {((2 .. 7) \cup ({} \cap [a |-> 1])), ((2..1 \ 2..1) \cup {<<>>, 2147483647})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 43 to line 14, col 50 of module random_04510
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04510 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<>>
---*)
