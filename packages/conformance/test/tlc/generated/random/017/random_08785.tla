(*---
description: Evaluates a random record expression, seed 262, number 8785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (\A b13613 \in DOMAIN 1 : (\E b13614 \in {x \in 1..3 : x > 1} : TRUE)) THEN CASE (FALSE <=> TRUE) -> (-3) [] OTHER -> ([a |-> 1, b |-> TRUE]).a ELSE ((-3) + Head(<<1, 2>>)), b |-> (\A b13615 \in ((<<>> \cup SUBSET {1}) \ {b13616 \in {x \in 1..3 : x > 1} : FALSE}) : ((<<1, 2>> \o <<1>>) = [b13617 \in {} |-> b13615]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08785 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 41 to line 14, col 48 of module random_08785
---*)
