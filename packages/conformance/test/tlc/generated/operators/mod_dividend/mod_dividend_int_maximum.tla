(*---
description: mod_dividend applied to int_maximum, a IntValue.
ref: tlc2/module/Naturals.java#Mod
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE mod_dividend_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2147483647 % 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
