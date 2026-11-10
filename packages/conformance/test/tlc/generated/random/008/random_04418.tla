(*---
description: Evaluates a random bool expression, seed 262, number 4418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b6952 \in {1, 2} : FALSE})[(7 - 1)] \div {CASE TRUE -> 1 [] OTHER -> 7, (0 \div 2)}) = (Len(SubSeq(<<1, 2>>, 0, 3)) * ((CHOOSE r \in [a : {1, 2}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04418 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 18 to line 14, col 54 of module random_04418
---*)
