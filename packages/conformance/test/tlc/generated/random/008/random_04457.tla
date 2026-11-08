(*---
description: Evaluates a random seq expression, seed 262, number 4457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Append((<<>> \o <<1, 2>>), CASE FALSE -> 7 [] OTHER -> 2) EXCEPT ![1] = Cardinality((2..1 \ {1}))] EXCEPT ![1] = (CASE (\A b7017 \in 2..1 : TRUE) -> (2 + 2147483647) [] OTHER -> Tail(<<1>>) * Cardinality({2, -1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04457 failed.
    2178:0 Overflow when computing 2+2147483647
---*)
