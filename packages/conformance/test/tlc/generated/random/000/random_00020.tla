(*---
description: Evaluates a random function expression, seed 262, number 20.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 3, b |-> FALSE]).a + Head(Append(<<3, 1, 2>>, 0))) :> ([b26 \in UNION {SUBSET {1}, Nat} |-> (2147483647 + b26)])[IF (FALSE <=> FALSE) THEN (3 * 2) ELSE (-1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00020 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
