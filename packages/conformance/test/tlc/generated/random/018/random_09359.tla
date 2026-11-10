(*---
description: Evaluates a random bool expression, seed 262, number 9359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14528 \in (({b14529 : b14529 \in {x \in 1..3 : x > 1}} \ ({1, 2} \cup 2..1)) \ ((Nat => TRUE) <=> ({1, 2} \subseteq Nat))) : ((Head(<<1>>) * ([a |-> 1]).a) < ((CHOOSE b14530 \in {x \in 1..3 : x > 1} : FALSE) % Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09359 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a special set constant.
    line 14, col 102 to line 14, col 112 of module random_09359
---*)
