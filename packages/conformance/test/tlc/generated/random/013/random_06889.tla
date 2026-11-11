(*---
description: Evaluates a random seq expression, seed 262, number 6889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) \/ (~TRUE)) -> (-Head(<<3, 1, 2>>)) [] OTHER -> ([a |-> 1, b |-> TRUE]).a, [a |-> (-(-7)), b |-> ((7 \in 1..3) /\ (2 = <<>>))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06889 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 24 to line 14, col 89 of module random_06889
---*)
