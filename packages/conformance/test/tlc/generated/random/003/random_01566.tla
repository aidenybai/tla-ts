(*---
description: Evaluates a random set expression, seed 262, number 1566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Head(<<1, 2>>), b |-> (~FALSE)] EXCEPT !.a = @ + ((2147483647 % 3) + Len(<<1, 2>>))] \ {b2502 \in ({b2503 \in {1, 2} : FALSE} \ (2 .. -1)) : (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) = [2..1 EXCEPT ![b2502] = b2502])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 4, b |-> TRUE]
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 4, b |-> TRUE]
    is not enumerable.
---*)
