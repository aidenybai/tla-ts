(*---
description: Evaluates a random int expression, seed 262, number 5398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {UNION {{b8351 \in SUBSET {1} : FALSE}, [[a |-> 1] EXCEPT !.a = -1]}, ({b8352 \in Nat : TRUE} \ UNION {{1, 2}, 2..1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05398 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
