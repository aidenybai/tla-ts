(*---
description: Evaluates a random function expression, seed 262, number 558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b945 \in UNION {(LET b946 == 1 IN b946 .. CASE FALSE -> 2 [] OTHER -> 7), ((1 .. -1) \cup (Nat \ {}))} |-> (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00558 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
