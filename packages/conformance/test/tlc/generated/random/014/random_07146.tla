(*---
description: Evaluates a random seq expression, seed 262, number 7146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10978 \in ({b10979 \in DOMAIN [a |-> 1, b |-> TRUE] : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} \ {(-b10980) : b10980 \in (7 .. 0)}) |-> (CHOOSE b10981 \in DOMAIN ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) : ((\A b10982 \in {1} : TRUE) \/ (TRUE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07146 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
