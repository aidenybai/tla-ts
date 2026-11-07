(*---
description: Evaluates a random seq expression, seed 262, number 4000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q), LAMBDA e : e > 0) EXCEPT ![1] = Head(Append({b6290 \in -1 : TRUE}, Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {b6290 \in -1 : <expression line 14, col 134 to line 14, col 137 of module random_04000> }
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {b6290 \in -1 : <expression line 14, col 134 to line 14, col 137 of module random_04000> }
---*)
