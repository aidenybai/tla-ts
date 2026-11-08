(*---
description: Evaluates a random record expression, seed 262, number 7029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-([<<5, 6>> EXCEPT ![7] = 1] @@ [[x \in Nat |-> x + 1] EXCEPT ![3] = 7])), b |-> (Len((<<>> \o <<1>>)) \in ({[a |-> 1], 3} \cup {b10784 \in {} : [a |-> 1, b |-> TRUE]}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 34 of module random_07029
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07029 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
