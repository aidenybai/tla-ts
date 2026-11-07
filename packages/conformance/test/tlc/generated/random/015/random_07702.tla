(*---
description: Evaluates a random set expression, seed 262, number 7702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> Head(<<1, 2>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] % LET b11870 == (CHOOSE b11871 \in {x \in 1..3 : x > 1} : TRUE) IN (b11870 :> 0)) : b11869 \in SubSeq(Tail(<<-1, 2>>), LET b11872 == (1 + 3) IN ([a |-> 1, b |-> TRUE]).a, Cardinality(([x \in 1..2 |-> x] \ {})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<1, 2>>
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<1, 2>>
    is not enumerable.
---*)
