(*---
description: Evaluates a random set expression, seed 262, number 4017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b6308 \in ({1} \cap {x \in 1..3 : x > 1}) : (FALSE \/ TRUE)} = UNION {UNION {2..1, {2, 1, 3}}, DOMAIN [x \in 1..2 |-> x]}) \ UNION {UNION {(Nat \cap 7), {b6309 \in {1} : FALSE}}, {b6310 \in UNION {2..1, {2, 1, 3}} : (\A b6311 \in {x \in 1..3 : x > 1} : TRUE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    7
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    7
    is enumerable
---*)
