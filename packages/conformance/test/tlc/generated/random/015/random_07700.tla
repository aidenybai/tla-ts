(*---
description: Evaluates a random set expression, seed 262, number 7700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11865 \in (CASE (FALSE => FALSE) -> (1 * 7) [] OTHER -> LET b11866 == 2147483647 IN b11866 :> Cardinality({b11867 \in Nat : FALSE})) : (((1 .. b11865) = {b11865, 2}) /\ (\E b11868 \in (SUBSET {1} \cup 1..3) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    7
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    7
    is not enumerable
---*)
