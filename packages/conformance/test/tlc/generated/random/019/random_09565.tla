(*---
description: Evaluates a random bool expression, seed 262, number 9565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14852 \in (CASE (\A b14853 \in {1} : TRUE) -> ([x \in 1..2 |-> x])[-1] [] OTHER -> (2 + 7) .. (-Head(<<1>>))) : ((({x \in 1..3 : x > 1} \ {2, 1, 3}) \cup (CHOOSE r \in [a : 2..1] : TRUE)) \ {(2147483647 \div b14852), Cardinality({1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09565 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
