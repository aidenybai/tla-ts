(*---
description: Evaluates a random seq expression, seed 262, number 599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(<<([a |-> 1]).a, (<<5, 6>>)[7]>>, LET b1005 == CASE FALSE -> 2 [] OTHER -> -1 IN CASE TRUE -> b1005 [] OTHER -> -1), Len(<<([a |-> 1]).a, (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00599 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
