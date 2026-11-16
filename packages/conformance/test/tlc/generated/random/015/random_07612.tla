(*---
description: Evaluates a random int expression, seed 262, number 7612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11708 \in UNION {({b11709 : b11709 \in {1, 2}} \cap UNION {{}, 2..1}), {CASE FALSE -> FALSE [] OTHER -> 0, (3 - 2)}} : {b11710 \in DOMAIN (7 :> 1) : ((TRUE => FALSE) => (\A b11711 \in {1, 2} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07612 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 17 to line 14, col 225 of module random_07612
---*)
