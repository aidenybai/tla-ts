(*---
description: Evaluates a random bool expression, seed 262, number 1777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Len(<<>>)] => (~(~FALSE))) => (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01777 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 18 to line 14, col 93 of module random_01777
---*)
