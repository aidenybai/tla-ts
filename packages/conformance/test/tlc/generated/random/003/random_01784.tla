(*---
description: Evaluates a random function expression, seed 262, number 1784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2823 \in ({b2824 \in SelectSeq(<<>>, LAMBDA e : e > 0) : (b2824 = (1 :> 2))} \ (UNION {2..1, 1..3} \cap (SUBSET {1} \ {1, 2}))) : ([a |-> CASE TRUE -> 7 [] OTHER -> b2823, b |-> (FALSE /\ FALSE)] = [a |-> (-7), b |-> (TRUE \/ TRUE)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<>>
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<>>
    is not enumerable
---*)
