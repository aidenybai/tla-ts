(*---
description: cup of colon_greater, a FcnRcdValue, and int, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_colon_greater__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) \cup (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_colon_greater__int failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    <<2>>
    and T:
    Int
    are not both enumerable
---*)
