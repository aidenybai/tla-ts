(*---
description: Evaluates a random int expression, seed 262, number 2282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((1 :> 2) = [a |-> 0, b |-> TRUE]) -> ((3 + 0) + (-1 - -1)) [] OTHER -> ([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = [a |-> 1, b |-> TRUE]])[LET b3597 == -1 IN -1], (((CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))[(-1 * 3)] - ([a |-> 0, b |-> FALSE]).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02282 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
