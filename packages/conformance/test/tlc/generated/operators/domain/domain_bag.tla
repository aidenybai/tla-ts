(*---
description: domain applied to bag, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
