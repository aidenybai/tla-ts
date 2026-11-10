(*---
description: Evaluates a random seq expression, seed 262, number 4003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail([<<7, 1>> EXCEPT ![1] = UNION {1..3, SUBSET {1}}]) \o UNION {{CASE TRUE -> 2147483647 [] OTHER -> -1, [[a |-> 1] EXCEPT !.a = @ + 3]}, (DOMAIN [x \in Nat |-> x + 1] \ (SUBSET {1} \cup {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04003 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Concat(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
