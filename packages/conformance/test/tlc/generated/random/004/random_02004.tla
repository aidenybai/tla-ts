(*---
description: Evaluates a random int expression, seed 262, number 2004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![7] = 3] @@ [b3174 \in {1} |-> 2]))[CASE ([a |-> 1] <=> TRUE) -> (-7) [] OTHER -> ([x \in Nat |-> x + 1])[2147483647]] :> ((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[Append(Tail(<<1, 2>>), (2147483647 :> 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_02004
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02004 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 79 to line 14, col 96 of module random_02004
---*)
