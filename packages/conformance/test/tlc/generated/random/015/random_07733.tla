(*---
description: Evaluates a random function expression, seed 262, number 7733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11927 \in (((2147483647 + 0) % Head(<<1, 2>>)) = ((CHOOSE f \in [2..1 -> 2..1] : TRUE))[([a |-> 1]).a]) |-> ((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE) % Head(<<b11927, b11927>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07733 failed.
    Attempted to apply function:
    <<>>
    to argument 1, which is not in the domain of the function.
---*)
