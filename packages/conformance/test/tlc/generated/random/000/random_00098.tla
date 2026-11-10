(*---
description: Evaluates a random record expression, seed 262, number 98.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), {Cardinality(1..3) : b151 \in DOMAIN [x \in 1..2 |-> x]}} \ {CASE ({} = 2..1) -> CASE FALSE -> 7 [] OTHER -> b152 [] OTHER -> (-1 - 7) : b152 \in DOMAIN (-1 :> -1)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00098 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
