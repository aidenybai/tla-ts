(*---
description: Evaluates a random set expression, seed 262, number 5062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b7874 \in (\A b7875 \in ({} \ Nat) : (\A b7876 \in {x \in 1..3 : x > 1} : FALSE)) : {([a |-> 1, b |-> TRUE]).a, (-3)}} \cap UNION {({b7877 \in Nat : FALSE} \ UNION {{x \in 1..3 : x > 1}, (1 :> 2)}), {b7878 \in ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) : (1..3 = {})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<2>> with the value:
    {2, 3}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<2>> with the value:
    {2, 3}
---*)
