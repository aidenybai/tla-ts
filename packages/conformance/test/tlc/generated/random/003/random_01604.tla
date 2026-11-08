(*---
description: Evaluates a random function expression, seed 262, number 1604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2561 \in (UNION {(FALSE <=> TRUE), {2, 3}} \cup DOMAIN (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)) |-> Head((SubSeq(<<3, 1, 2>>, b2561, 2) \o <<b2561, -1>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01604 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {2, 3} with the value:
    FALSE
---*)
