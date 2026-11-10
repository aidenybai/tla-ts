(*---
description: Evaluates a random function expression, seed 262, number 729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1200 \in {b1201 \in {(1 % 2), ({1}).a} : ((<<1, 2>> \o <<3, 1, 2>>) = (CHOOSE f \in [{1, 2} -> {}] : TRUE))} |-> IF ((3 % b1200) \in ({1} \cap {1, 2})) THEN Len(([a |-> 1] \o <<>>)) ELSE ((CHOOSE b1202 \in 2..1 : TRUE) + (2147483647 + b1200))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00729 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 48 to line 14, col 54 of module random_00729
---*)
