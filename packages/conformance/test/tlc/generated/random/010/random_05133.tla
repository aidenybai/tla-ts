(*---
description: Evaluates a random function expression, seed 262, number 5133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![([a |-> ([a |-> 1]).a, b |-> ({2, 1, 3} \subseteq SUBSET {1})]).a] = [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = LET b7978 == (2 \div 2) IN (0 % b7978)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05133 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
