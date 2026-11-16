(*---
description: Evaluates a random seq expression, seed 262, number 1226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((-1 % 3) = ([a |-> 1, b |-> TRUE]).a) -> (SubSeq(<<1>>, -1, 2) \o <<1, 2>>) [] OTHER -> (CHOOSE b1974 \in UNION {[a |-> 1, b |-> TRUE], 2..1} : (TRUE \/ TRUE)), ((CHOOSE r \in [a : {}] : TRUE)).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01226 failed.
    Attempted to compare the set {} with the value:
    [a |-> 1, b |-> TRUE]
---*)
