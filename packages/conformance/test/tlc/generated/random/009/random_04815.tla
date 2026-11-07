(*---
description: Evaluates a random seq expression, seed 262, number 4815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (CHOOSE b7508 \in {1} : TRUE)) \o Append(({1} \cup {1}), (-0))), [a |-> CASE ([a |-> 1] /\ TRUE) -> (7 - 2) [] OTHER -> (3 * 0), b |-> (({2, 1, 3} \ {2, 1, 3}) \subseteq {b7509 \in 1..3 : b7509})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1}
---*)
