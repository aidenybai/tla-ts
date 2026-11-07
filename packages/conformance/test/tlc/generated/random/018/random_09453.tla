(*---
description: Evaluates a random seq expression, seed 262, number 9453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + Cardinality({1})] EXCEPT !.a = @ + (-LET b14670 == 1 IN b14670)] \o SubSeq(SubSeq([[x \in Nat |-> x + 1] EXCEPT ![1] = 1], IF TRUE THEN 7 ELSE 2147483647, (2147483647 - 0)), ((<<5, 6>> @@ (1 :> 2)) + (2147483647 - -1)), Cardinality({b14671 \in 2..1 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.SubSeq(tlc2.value.impl.Value,tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.SubSeq(tlc2.value.impl.Value,tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
