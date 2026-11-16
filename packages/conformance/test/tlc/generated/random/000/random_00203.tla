(*---
description: Evaluates a random record expression, seed 262, number 203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (CHOOSE b332 \in {1, 2} : FALSE)] EXCEPT !.a = CASE (\E b333 \in {x \in 1..3 : x > 1} : TRUE) -> (2147483647 < 3) [] OTHER -> ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = (((<<5, 6>>)[-1] + ([x \in 1..2 |-> x])[3]) * Head(<<SUBSET {1}, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00203 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
