(*---
description: Evaluates a random set expression, seed 262, number 9944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b15469 \in (IF Append(<<>>, 2147483647) THEN (CHOOSE b15470 \in {x \in 1..3 : x > 1} : FALSE) ELSE CASE FALSE -> -1 [] OTHER -> 1 .. CASE (<<1>> = [x \in 1..2 |-> x]) -> (<<5, 6>>)[0] [] OTHER -> ({x \in 1..3 : x > 1} \cup {1})) : (((b15469)[2147483647] - Head(<<1>>)) < UNION {UNION {2..1, {1}}, [a |-> <<3, 1, 2>>, b |-> FALSE]})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09944 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 29 to line 14, col 243 of module random_09944
---*)
