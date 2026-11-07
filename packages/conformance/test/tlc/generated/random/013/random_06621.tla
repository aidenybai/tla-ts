(*---
description: Evaluates a random seq expression, seed 262, number 6621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(UNION {UNION {(Nat \ {1}), (1 .. 3)}, (({1, 2} \cap 2..1) \ (Nat \cup {}))}, (([b10166 \in Nat |-> 0] @@ [b10167 \in {2, 1, 3} |-> b10167]))[(LET b10168 == 2147483647 IN 2147483647 % ([x \in 1..2 |-> x])[2])], (-(CHOOSE r \in [a : {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
