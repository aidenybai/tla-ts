(*---
description: Evaluates a random function expression, seed 262, number 2352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3726 \in DOMAIN ((CHOOSE b3727 \in SUBSET {1} : TRUE) :> LET b3728 == -1 IN 0) |-> (Cardinality(({2, 1, 3} \cup <<>>)) * Cardinality(DOMAIN (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    <<>>
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    <<>>
    are not both enumerable
---*)
