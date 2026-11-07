(*---
description: Evaluates a random set expression, seed 262, number 8831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cup 2..1) \cap {3, 0}) \cap ((CHOOSE b13677 \in {x \in 1..3 : x > 1} : TRUE) .. Head(<<3, 1, 2>>))) \cup DOMAIN [b13678 \in UNION {{}, Nat} |-> ((1 :> 2))[2]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
