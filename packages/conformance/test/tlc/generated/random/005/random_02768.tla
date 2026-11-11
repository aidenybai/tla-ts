(*---
description: Evaluates a random int expression, seed 262, number 2768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([(CHOOSE f \in [{} -> 1..2] : TRUE) EXCEPT ![(-3)] = Len(<<>>)])[(CASE TRUE -> -1 [] OTHER -> 1 % (3 \div 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 52 of module random_02768
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02768 failed.
    Attempted to apply function:
    <<>>
    to argument -1, which is not in the domain of the function.
---*)
