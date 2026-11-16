(*---
description: Evaluates a random int expression, seed 262, number 9582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ({b14876 \in {b14877 : b14877 \in 2..1} : (TRUE \/ TRUE)} \subseteq UNION {DOMAIN FALSE, (7 .. <<3, 1, 2>>)}) -> Cardinality({b14878 \in {7 : b14879 \in SUBSET {1}} : (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)}) [] OTHER -> ((Cardinality({1, 2}))[CASE FALSE -> 2 [] OTHER -> -1] + Head(Tail(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09582 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 96 to line 14, col 107 of module random_09582
---*)
