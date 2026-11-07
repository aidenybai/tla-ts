(*---
description: Evaluates a random record expression, seed 262, number 1575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT ![(3 * 2147483647)] = (1 + 0)] EXCEPT !.a = Len((CHOOSE r \in [a : 2..1] : TRUE))] EXCEPT !.a = @ + ([b2516 \in (1..3 \ -1) |-> ([a |-> 1, b |-> TRUE]).a])[(Len(<<1>>) + Cardinality({1}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3*2147483647
    2178:0 Overflow when computing 3*2147483647
---*)
