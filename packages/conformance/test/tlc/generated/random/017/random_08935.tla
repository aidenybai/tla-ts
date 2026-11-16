(*---
description: Evaluates a random function expression, seed 262, number 8935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13859 \in (({2, 1, 3} \ SUBSET {1}) \cap ({} \ {x \in 1..3 : x > 1})) : (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) = (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE))) :> (((2147483647 :> 3))[(3 - 0)] - [a |-> ([a |-> 1]).a, b |-> ({} \subseteq {})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08935 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
