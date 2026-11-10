(*---
description: Evaluates a random function expression, seed 262, number 1015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1632 \in (((2..1 \ {2, 1, 3}) \cup DOMAIN [x \in Nat |-> x + 1]) \ UNION {DOMAIN <<5, 6>>, (3 \ 1..3)}) |-> CASE ([a |-> 0, b |-> TRUE] = [a |-> 2147483647, b |-> TRUE]) -> ((b1632 \div 7) \div [[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]) [] OTHER -> ([a |-> b1632, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01015 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    3
    is not enumerable.
---*)
