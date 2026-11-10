(*---
description: Evaluates a random record expression, seed 262, number 5080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((<<5, 6>> @@ <<5, 6>>) @@ (3 :> 3)))[(Cardinality(<<>>) % CASE TRUE -> 3 [] OTHER -> 0)], b |-> (((1..3 = {1, 2}) /\ (FALSE \/ TRUE)) \subseteq ((FALSE .. 1) \cap UNION {{1}, 1..3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05080 failed.
    2181:0 Attempted to compute cardinality of the value
    <<>>
---*)
