(*---
description: Evaluates a random function expression, seed 262, number 3286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5224 \in ((DOMAIN [x \in Nat |-> x + 1] \ UNION {2..1, {1}}) \ {b5225 \in {<<>> : b5226 \in {1, 2}} : ({1, 2} = {1, 2})}) |-> Head(Append((<<3, 1, 2>> \o <<>>), LET b5227 == 7 IN b5227))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b5224 \\in Nat \\ {1} \\ {<<>>} |-> <expression line 14, col 144 to line 14, col 203 of module random_03286>]"
---*)
