(*---
description: Evaluates a random bool expression, seed 262, number 2633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4153 \in {(CHOOSE b4155 \in {7, b4154} : (<<3, 1, 2>> \o <<1, 2>>)) : b4154 \in (LET b4156 == 7 IN 2147483647 .. (-0))} : ([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = (<<5, 6>>)[[a |-> 1]]] = ((\E b4157 \in {1} : FALSE) @@ [b4158 \in 2..1 |-> 1]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
