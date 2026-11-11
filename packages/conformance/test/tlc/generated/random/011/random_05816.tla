(*---
description: Evaluates a random record expression, seed 262, number 5816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b8962 == CASE ({2, 1, 3} \subseteq 1..3) -> ((1 :> 2))[7] [] OTHER -> (1 % 1) IN (IF FALSE THEN -1 ELSE b8962 % Len(<<>>)), b |-> ((\A b8963 \in UNION {Nat, {2, 1, 3}} : ({1, 2} \subseteq 2..1)) <=> (~Append(<<1>>, (1 :> 2))))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05816 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
