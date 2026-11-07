(*---
description: Evaluates a random set expression, seed 262, number 3400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((<<1>> \o <<1, 2>>)) * Cardinality(([x \in Nat |-> x + 1] \ {1, 2}))) .. (CHOOSE b5398 \in ((-1 .. 2) \cap (0 .. 0)) : ((b5398 = b5398) <=> (2 = -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [x \in Nat |-> <expression line 14, col 73 to line 14, col 77 of module random_03400>]
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [x \in Nat |-> <expression line 14, col 73 to line 14, col 77 of module random_03400>]
    is not enumerable.
---*)
