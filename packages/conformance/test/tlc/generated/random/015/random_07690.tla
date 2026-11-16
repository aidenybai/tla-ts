(*---
description: Evaluates a random record expression, seed 262, number 7690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(Len(<<1>>) \div Head(<<1>>))] = ((CHOOSE b11844 \in 2..1 : TRUE) :> Head(<<3, 1, 2>>))], b |-> ([a |-> (-3), b |-> ({1, 2} \subseteq 1..3)] < (Cardinality({x \in 1..3 : x > 1}) * ((1 :> 2))[2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 80 of module random_07690
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07690 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
