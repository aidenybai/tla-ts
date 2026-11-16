(*---
description: Evaluates a random set expression, seed 262, number 4976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \cap 2..1) \ UNION {Nat, {1}}) \cap (UNION {{}, Nat} \ ({2, 1, 3} \cap {}))) \ DOMAIN [b7752 \in DOMAIN (1 :> 2) |-> (b7752 + b7752)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
