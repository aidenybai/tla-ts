(*---
description: Evaluates a random function expression, seed 262, number 2790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(-b4414) : b4414 \in UNION {{1}, 2..1}}) :> CASE (Append(FALSE, 2) = (CHOOSE f \in [{} -> 2..1] : TRUE)) -> IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (-1) ELSE (7 * 3) [] OTHER -> (\A b4415 \in {b4416 \in {2, 1, 3} : [x \in 1..2 |-> x]} : (b4415 = b4415))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
---*)
