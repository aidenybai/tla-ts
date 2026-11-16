(*---
description: Evaluates a random function expression, seed 262, number 5699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b8775 \in UNION {{1}, {}} : (FALSE <=> FALSE)) :> CASE (~FALSE) -> (3 * 1) [] OTHER -> [(1 :> 2) EXCEPT !.a = @ + <<1>>]) @@ (CHOOSE f \in [{} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)
