(*---
description: Evaluates a random seq expression, seed 262, number 4556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(SortSeq(Append([x \in Nat |-> x + 1], 3), LAMBDA p, q : p < q)), (((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[Len(<<3, 1, 2>>)] + (-IF TRUE THEN 1 ELSE 2147483647)), (CHOOSE b7141 \in {b7142 \in {b7143 \in {2, 1, 3} : TRUE} : (FALSE => TRUE)} : ({FALSE : b7144 \in 1..3} \subseteq {b7145 \in {} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Append(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Append(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
