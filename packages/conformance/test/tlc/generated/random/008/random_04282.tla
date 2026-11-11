(*---
description: Evaluates a random function expression, seed 262, number 4282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6741 \in (((Nat \ 1..3) \cup UNION {SUBSET {1}, {x \in 1..3 : x > 1}}) \cup (IF FALSE THEN TRUE ELSE -1 .. CASE TRUE -> 1 [] OTHER -> 2)) |-> CASE ({b6742 \in {} : TRUE} \subseteq (SUBSET {1} \cup {1})) -> ([<<1>> EXCEPT ![1] = 7] @@ (b6741 :> b6741)) [] OTHER -> Cardinality((1..3 \cup 1..3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04282 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
---*)
