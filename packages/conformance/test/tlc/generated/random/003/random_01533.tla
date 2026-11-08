(*---
description: Evaluates a random bool expression, seed 262, number 1533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2436 \in (Head(Append(<<1, 2>>, 2)) = Cardinality({b2437 \in {} : FALSE})) : ((CASE FALSE -> b2436 [] OTHER -> 7 < (CHOOSE f \in [{} -> {}] : TRUE)) /\ ((3 * [x \in 1..2 |-> x]) = (-<<1>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01533 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
