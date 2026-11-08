(*---
description: Evaluates a random set expression, seed 262, number 1962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN ((CHOOSE f \in [{} -> 2..1] : TRUE) @@ SubSeq(<<>>, 0, -1)), {CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> LET b3100 == b3099 IN 1 [] OTHER -> (CHOOSE b3101 \in {x \in 1..3 : x > 1} : FALSE) : b3099 \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = (CHOOSE b3102 \in {x \in 1..3 : x > 1} : TRUE)]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01962 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
