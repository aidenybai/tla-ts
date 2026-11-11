(*---
description: Java's Double.valueOf accepts a hexadecimal float, so "0x1p-1" is 0.5.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_hex_float ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(0, "0x1p-1", {1}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
