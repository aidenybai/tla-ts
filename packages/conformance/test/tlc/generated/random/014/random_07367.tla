(*---
description: Evaluates a random int expression, seed 262, number 7367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11333 \in (<<3, 2>> \ {b11334 \in {x \in 1..3 : x > 1} : TRUE}) |-> ((CHOOSE b11335 \in 2..1 : FALSE) * (b11333 - b11333))] @@ (CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<3, 2>>
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<3, 2>>
    is not enumerable.
---*)
