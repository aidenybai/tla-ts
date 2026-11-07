(*---
description: Evaluates a random seq expression, seed 262, number 9154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b14219 \in DOMAIN (0 :> 7) : (CASE FALSE -> b14219 [] OTHER -> <<5, 6>> \in ([a |-> 1] \ {1}))), Cardinality(((0 .. [a |-> 1, b |-> TRUE]) \subseteq ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09154 failed.
    Attempted to check if element:
    <<5, 6>>
    is in the record:
    [a |-> 1]
---*)
