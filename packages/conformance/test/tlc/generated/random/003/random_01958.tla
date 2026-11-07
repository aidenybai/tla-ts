(*---
description: Evaluates a random set expression, seed 262, number 1958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3085 \in {b3086 \in ((3 \div 7) \cup {3, 0}) : (\E b3087 \in ({} \cup SUBSET {1}) : [a |-> 1, b |-> FALSE])} : ({(b3085 + -1) : b3088 \in (2..1 \cap Nat)} \subseteq {Head(<<>>) : b3089 \in DOMAIN <<5, 6>>})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {0, 3}
    and T:
    0
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {0, 3}
    and T:
    0
    are not both enumerable
---*)
