(*---
description: Evaluates a random seq expression, seed 262, number 8977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b13932 \in UNION {(2 .. 7), (<<3, 1, 2>> = [x \in 1..2 |-> x])} |-> IF (b13932 < 2) THEN IF FALSE THEN -1 ELSE 3 ELSE LET b13933 == 1 IN 2147483647])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    2..7
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    2..7
---*)
