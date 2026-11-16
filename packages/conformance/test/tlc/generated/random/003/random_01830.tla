(*---
description: Evaluates a random bool expression, seed 262, number 1830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b2897 == (LET b2898 == 7 IN 1 \div ([a |-> 1]).a) IN (CHOOSE b2899 \in (Nat \cup SUBSET {1}) : (<<1, 2>> = [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01830 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {{}, {1}}
    are not both enumerable
---*)
