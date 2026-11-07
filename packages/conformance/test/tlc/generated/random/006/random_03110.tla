(*---
description: Evaluates a random set expression, seed 262, number 3110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{7, 3}, (2147483647 .. 2147483647)} \cup {UNION {SUBSET {1}, 2..1}, (2147483647 % 7)}) \ DOMAIN ((3 :> -1) @@ (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {{}, {1}}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {{}, {1}}
---*)
