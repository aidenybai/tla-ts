(*---
description: Evaluates a random set expression, seed 262, number 5424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE), ([[b8399 \in {1} |-> 2] EXCEPT ![IF FALSE THEN TRUE ELSE 3] = (7 \div 0)] \cup {b8400 \in (CHOOSE r \in [a : 1..2] : TRUE) : (\E b8401 \in {1, 2} : TRUE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 77 to line 14, col 97 of module random_05424
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05424 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    <<2>>
    and T:
    {b8400 \in [a |-> 1] : <expression line 14, col 201 to line 14, col 226 of module random_05424> }
    are not both enumerable
---*)
