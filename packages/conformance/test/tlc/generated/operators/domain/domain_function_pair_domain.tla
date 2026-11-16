(*---
description: domain applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [x \in {1}, y \in {2} |-> x + y])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>}"
---*)
