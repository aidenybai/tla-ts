(*---
description: Evaluates a random int expression, seed 262, number 7310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(CHOOSE f \in [2..1 -> 1..2] : TRUE), LET b11261 == 2 IN -1}) \div (-(CHOOSE b11262 \in {1, 3} : [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b11262]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    <<>>
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    <<>>
---*)
