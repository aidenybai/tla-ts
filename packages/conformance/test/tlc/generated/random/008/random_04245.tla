(*---
description: Evaluates a random record expression, seed 262, number 4245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ((CHOOSE r \in [a : 1..2] : TRUE)).a] EXCEPT !.a = @ + [a |-> ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE))[[(1 :> 2) EXCEPT ![0] = 7]], b |-> (Cardinality({}) < (-2147483647))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 189 to line 14, col 194 of module random_04245
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04245 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<2>>
---*)
