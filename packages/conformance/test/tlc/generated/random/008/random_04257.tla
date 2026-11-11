(*---
description: Evaluates a random set expression, seed 262, number 4257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((Head(<<3, 1, 2>>) \div LET b6695 == 2 IN b6695) .. ([a |-> 2, b |-> FALSE]).a), ((CHOOSE b6696 \in {b6697 \in TRUE : FALSE} : (~2..1)) .. IF ({x \in 1..3 : x > 1} \subseteq {}) THEN (1 * 1) ELSE Head(<<3, 1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04257 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    TRUE
    is not enumerable
---*)
