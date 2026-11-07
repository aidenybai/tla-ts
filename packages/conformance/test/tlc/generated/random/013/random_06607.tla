(*---
description: Evaluates a random function expression, seed 262, number 6607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b10134 \in [a |-> 1] : FALSE}) :> (-IF TRUE THEN 3 ELSE 2147483647)) @@ [b10135 \in (([x \in 1..2 |-> x])[2147483647] :> CASE TRUE -> 2 [] OTHER -> 3) |-> LET b10136 == ([a |-> 1]).a IN (-[a |-> 1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1]
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1]
    is not enumerable
---*)
