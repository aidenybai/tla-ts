(*---
description: Evaluates a random record expression, seed 262, number 7662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> -1 [] OTHER -> 3, b |-> (7 = -1)] EXCEPT !.a = @ + Cardinality({[x \in 1..2 |-> x], -1})] EXCEPT !.a = IF ((7 \div 1) = IF FALSE THEN 2147483647 ELSE 3) THEN ((3 \div 1) + (CHOOSE b11794 \in 2..1 : FALSE)) ELSE ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    <<1, 2>>
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    <<1, 2>>
---*)
