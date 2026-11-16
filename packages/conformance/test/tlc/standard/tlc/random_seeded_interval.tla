(*---
description: With the fixed seed, the picks from an interval repeat exactly.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_seeded_interval ----
EXTENDS TLC, Naturals
Test == PrintT(<<RandomElement(1..1000), RandomElement(1..1000), RandomElement(1..1000)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<731, 919, 919>>"
---*)
