(*---
description: Evaluates a random set expression, seed 262, number 86.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b133 \in (DOMAIN <<5, 6>> \subseteq {7, 0}) : ((-1 \div b133) \in DOMAIN [x \in Nat |-> x + 1])} \ {b134 \in ([a |-> 2, b |-> FALSE] \ (1..3 \cup {1, 2})) : (LET b135 == 2 IN 1 = CASE FALSE -> 7 [] OTHER -> 7)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00086 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
