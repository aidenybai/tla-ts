(*---
description: Evaluates a random function expression, seed 262, number 4011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<>> \o <<1, 2>>)) :> (-(TRUE).a)) @@ [(CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) EXCEPT ![Cardinality((Nat \cup {}))] = ((7 * 7) + (-1 * 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04011 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 48 to line 14, col 55 of module random_04011
---*)
