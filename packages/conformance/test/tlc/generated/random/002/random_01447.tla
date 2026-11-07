(*---
description: Evaluates a random function expression, seed 262, number 1447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2317 \in DOMAIN ([a |-> 1, b |-> TRUE] @@ <<5, 6>>) |-> Len(Tail(<<1>>))] EXCEPT ![(Cardinality(DOMAIN [x \in 1..2 |-> x]) - Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))] = ((IF TRUE THEN 2 ELSE -1 * (2147483647 % 7)) + ((0 - 7) + Len(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
