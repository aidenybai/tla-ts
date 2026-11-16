(*---
description: Evaluates a random record expression, seed 262, number 3647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b5766 \in 1..3 : TRUE), b |-> (<<3, 1, 2>> /\ TRUE)] EXCEPT !.a = @ + CASE (\A b5767 \in 2..1 : FALSE) -> (0 - 7) [] OTHER -> IF FALSE THEN -1 ELSE 7] EXCEPT !.a = LET b5768 == (-Len(<<1>>)) IN (CHOOSE b5769 \in ({1} \cap {1}) : (b5769 = <<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03647 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 64 to line 14, col 82 of module random_03647
---*)
