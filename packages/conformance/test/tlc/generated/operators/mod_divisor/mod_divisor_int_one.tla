(*---
description: mod_divisor applied to int_one, a IntValue.
ref: tlc2/module/Naturals.java#Mod
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE mod_divisor_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(7 % (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
