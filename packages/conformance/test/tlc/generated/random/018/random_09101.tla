(*---
description: Evaluates a random function expression, seed 262, number 9101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b14137 \in DOMAIN (CHOOSE f \in [{} -> 2..1] : TRUE) |-> ((3 % 3) + (CHOOSE b14138 \in {} : TRUE))] EXCEPT ![IF (({} \ {}) = ([a |-> 1] .. 1)) THEN (CHOOSE b14139 \in ({} \cap {1, 2}) : (FALSE => TRUE)) ELSE ((0 \div 2147483647) + (3 - -1))] = (-((<<5, 6>> @@ <<5, 6>>))[(1 - 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
