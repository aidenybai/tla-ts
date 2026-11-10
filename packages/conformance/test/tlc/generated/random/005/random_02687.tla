(*---
description: Evaluates a random function expression, seed 262, number 2687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4250 \in (((2..1 \ Nat) \ {b4251 : b4251 \in 2..1}) \cup UNION {(1..3 \cup <<3, 1, 2>>), {0 : b4252 \in {2, 1, 3}}}) |-> Len(((<<3, 1, 2>> \o <<3, 1, 2>>) \o (<<1>> \o <<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02687 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    <<3, 1, 2>>
    are not both enumerable
---*)
