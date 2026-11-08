(*---
description: Evaluates a random int expression, seed 262, number 738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((Append(<<2147483647, 7>>, Len([a |-> 1])) \o SubSeq((CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE), CASE TRUE -> 2147483647 [] OTHER -> 7, (2 % [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00738 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
---*)
