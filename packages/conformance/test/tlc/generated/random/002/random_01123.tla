(*---
description: Evaluates a random function expression, seed 262, number 1123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b1798 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] \cap (SUBSET {1} \ 2..1)) |-> ((<<5, 6>> @@ [x \in 1..2 |-> x]) + (-b1798))] @@ (CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if element:
    {}
    is in the record:
    [a |-> 2, b |-> TRUE]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if element:
    {}
    is in the record:
    [a |-> 2, b |-> TRUE]
---*)
