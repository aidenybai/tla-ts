(*---
description: Evaluates a random record expression, seed 262, number 3841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 \div 1) - Len(<<1>>)), b |-> ((TRUE => TRUE) <=> [a |-> -1, b |-> FALSE])] EXCEPT !.a = @ + [[a |-> CASE FALSE -> 3 [] OTHER -> 7, b |-> ({1} \cup SUBSET {1})] EXCEPT !.a = (CHOOSE b6055 \in DOMAIN [x \in 1..2 |-> x] : (\E b6056 \in SUBSET {1} : FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03841 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 58 to line 14, col 99 of module random_03841
---*)
