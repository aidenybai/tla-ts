(*---
description: Evaluates a random bool expression, seed 262, number 9160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14226 \in UNION {DOMAIN <<2147483647, 1>>, {b14227 \in DOMAIN <<3, 1, 2>> : (<<>> = <<5, 6>>)}} : (((2..1 \cup {}) \subseteq DOMAIN (1 :> 2)) /\ ((SUBSET {1} = SUBSET {1}) \/ (2147483647 \in {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
