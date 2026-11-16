(*---
description: Evaluates a random function expression, seed 262, number 9170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14238 \in (({x \in 1..3 : x > 1}).a .. ([a |-> 1, b |-> TRUE]).a) |-> Head(Append(b14238, 2147483647))] @@ (((CHOOSE f \in [{1, 2} -> 2..1] : TRUE) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE)) @@ ([<<5, 6>> EXCEPT ![3] = 2147483647] @@ [(1 :> 2) EXCEPT ![7] = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09170 failed.
    Attempted to select field "a" from a non-record value {2, 3}
    line 14, col 30 to line 14, col 53 of module random_09170
---*)
