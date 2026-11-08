(*---
description: Evaluates a random function expression, seed 262, number 2879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4564 \in UNION {((Nat \cup 2..1) \cap ({1} \ {2, 1, 3})), (CHOOSE r \in [a : {1}] : TRUE)} |-> (CHOOSE b4565 \in UNION {(2147483647 .. b4564), ({1} \ 2..1)} : ({1, b4565} = (1..3 \cup {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02879 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 1]
    with non-record
    {}
---*)
