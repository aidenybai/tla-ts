(*---
description: Evaluates a random set expression, seed 262, number 8722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{0, 2147483647}, {b13507 \in SUBSET {1} : FALSE}} \ (({x \in 1..3 : x > 1} \ 2..1) \cup {b13508 \in FALSE : TRUE})) \ (Cardinality({1 : b13509 \in {1, 2}}) .. Len([<<1>> EXCEPT ![1] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08722 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    0
    is an element of the boolean FALSE
---*)
