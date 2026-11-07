(*---
description: Evaluates a random function expression, seed 262, number 4359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) @@ [b6868 \in SUBSET {1} |-> 2147483647]) EXCEPT ![LET b6869 == ([a |-> 1, b |-> TRUE]).a IN IF TRUE THEN 1 ELSE [a |-> 1, b |-> TRUE]] = ((FALSE => FALSE) + LET b6870 == 2 IN b6870)] @@ [b6871 \in UNION {{3, 2}, {b6872 : b6872 \in SUBSET {1}}} |-> Len(Append(<<3, 1, 2>>, b6871))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
---*)
