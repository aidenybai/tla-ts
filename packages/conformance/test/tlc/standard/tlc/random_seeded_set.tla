(*---
description: With the fixed seed, the picks from an enumerated set repeat exactly.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_seeded_set ----
EXTENDS TLC, Naturals
Test == PrintT(<<RandomElement({"a", "b", "c", "d"}), RandomElement({"a", "b", "c", "d"})>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"b", "c">>'
---*)
