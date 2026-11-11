(*---
description: Evaluates a random function expression, seed 262, number 763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (\A b1250 \in SUBSET {1} : FALSE) -> CASE TRUE -> 3 [] OTHER -> Nat [] OTHER -> Head(<<3, 1, 2>>) * CASE (1..3 /\ TRUE) -> (-2) [] OTHER -> ([x \in 1..2 |-> x])[3]) :> <<((3 \div TRUE) * (-3)), CASE ({} \ {}) -> Cardinality(Nat) [] OTHER -> (-7)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00763 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form i..j.
    line 14, col 129 to line 14, col 140 of module random_00763
---*)
