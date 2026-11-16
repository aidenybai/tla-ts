(*---
description: Evaluates a random function expression, seed 262, number 9019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((7 :> 3) @@ (CHOOSE f \in [{} -> 1..2] : TRUE)) @@ ((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) @@ [<<5, 6>> EXCEPT ![1] = 1])) EXCEPT ![[a |-> (-(1 - 2)), b |-> (\E b14009 \in DOMAIN <<5, 6>> : (TRUE => TRUE))]] = (Len(<<2, 1>>) * (Cardinality({}) .. (-1 * 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09019 failed.
    Attempted to check equality of integer 7 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
