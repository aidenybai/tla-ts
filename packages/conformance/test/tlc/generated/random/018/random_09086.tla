(*---
description: Evaluates a random int expression, seed 262, number 9086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail([<<3, 1, 2>> EXCEPT ![1] = -1]) \o SubSeq((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE), ((1 :> 2))[1], ([a |-> 1, b |-> TRUE]).a)) * CASE ({7, 2} = ({} \ SUBSET {1})) -> CASE (<<1>> = Nat) -> Head(<<1>>) [] OTHER -> Cardinality({1, 2}) [] OTHER -> ((7 :> 3))[(7 * 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09086 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 66 to line 14, col 102 of module random_09086
---*)
