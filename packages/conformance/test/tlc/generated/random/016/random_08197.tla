(*---
description: Evaluates a random set expression, seed 262, number 8197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(([b12680 \in {1, 2} |-> b12680] @@ (3 :> 1)) .. Head(Append({1}, 2))), UNION {{[[x \in 1..2 |-> x] EXCEPT ![b12681] = b12681] : b12681 \in {b12682 \in <<1>> : TRUE}}, (([a |-> 1, b |-> TRUE] \ Nat) \cup DOMAIN TRUE)}})
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
