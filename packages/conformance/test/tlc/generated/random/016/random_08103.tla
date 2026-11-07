(*---
description: Evaluates a random set expression, seed 262, number 8103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12520 \in (UNION {UNION {{2, 1, 3}, {1, 2}}, {b12521 \in {1} : FALSE}} \cup (([x \in Nat |-> x + 1])[2] :> LET b12522 == 3 IN b12522)) : (LET b12523 == Len(<<1, 2>>) IN (CHOOSE b12524 \in {} : TRUE) = LET b12525 == ([a |-> 1, b |-> TRUE]).a IN IF TRUE THEN b12520 ELSE 0)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    (3 :> 3)
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    (3 :> 3)
    are not both enumerable
---*)
