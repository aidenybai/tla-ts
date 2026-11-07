(*---
description: Evaluates a random set expression, seed 262, number 7675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head((<<>> \o <<>>)) .. IF ({2, 1, 3} \/ TRUE) THEN SubSeq(<<3, 1, 2>>, 2, 1) ELSE IF FALSE THEN -1 ELSE 2), (DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) \cup {({x \in 1..3 : x > 1} \ {1}) : b11817 \in DOMAIN 0})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
