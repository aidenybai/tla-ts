(*---
description: Evaluates a random function expression, seed 262, number 1634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2609 \in (((1 \div 7) \div Len(2147483647)) .. (CHOOSE b2610 \in {b2611 \in {1} : TRUE} : (TRUE /\ TRUE))) |-> (((CHOOSE f \in [{} -> {1}] : TRUE) @@ <<0, 0>>))[CASE (~[a |-> 1]) -> LET b2612 == 3 IN 7 [] OTHER -> CASE FALSE -> 3 [] OTHER -> 0]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
---*)
