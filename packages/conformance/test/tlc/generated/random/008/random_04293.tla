(*---
description: Evaluates a random set expression, seed 262, number 4293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6760 \in {b6761 \in {b6762 \in (Nat \ 1..3) : (\E b6763 \in {2, 1, 3} : TRUE)} : (([a |-> 1] = [a |-> 1, b |-> TRUE]) <=> (\E b6764 \in {} : FALSE))} : ([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = ([a |-> 1])[0]] = (([x \in 1..2 |-> x])[b6760] :> SubSeq(<<1>>, 7, b6760)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
