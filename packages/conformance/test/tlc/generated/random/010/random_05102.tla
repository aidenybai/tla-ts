(*---
description: Evaluates a random set expression, seed 262, number 5102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b7938 \in (Len(<<3, 1, 2>>) \ (2..1 \cup {1})) : (\A b7939 \in (b7938 .. 3) : (<<3, 1, 2>> = [x \in Nat |-> x + 1]))}, DOMAIN (([x \in 1..2 |-> x] @@ (1 :> 2)) @@ [b7940 \in 1..3 |-> b7940])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05102 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    3
    is not enumerable.
---*)
