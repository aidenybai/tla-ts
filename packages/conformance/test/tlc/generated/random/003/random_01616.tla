(*---
description: Evaluates a random function expression, seed 262, number 1616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) EXCEPT ![(CHOOSE b2577 \in {(-b2578) : b2578 \in (FALSE <=> TRUE)} : (Cardinality(SUBSET {1}) < Append(<<1, 2>>, 2)))] = CASE (~([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> (([x \in 1..2 |-> x])[7] - ([a |-> 1, b |-> TRUE]).a) [] OTHER -> Head(SelectSeq(<<1>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01616 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 109 to line 14, col 122 of module random_01616
---*)
