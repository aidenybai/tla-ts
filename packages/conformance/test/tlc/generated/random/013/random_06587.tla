(*---
description: Evaluates a random seq expression, seed 262, number 6587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Append((<<1>> \o 2147483647), ([x \in 1..2 |-> x] @@ (1 :> 2))), IF (TRUE => TRUE) THEN (CHOOSE b10114 \in {x \in 1..3 : x > 1} : TRUE) ELSE (0 + [a |-> 1, b |-> TRUE]), (-(2..1 \ <<1, 2>>))) EXCEPT ![1] = ((-IF TRUE THEN 0 ELSE 2) % IF (1 < 1) THEN CASE TRUE -> -1 [] OTHER -> 0 ELSE (7 - 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06587 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
---*)
