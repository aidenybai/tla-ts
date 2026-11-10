(*---
description: A model value prints bare, without quotes.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE printt_model_value ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == PrintT(mv)
====

(*--- recorded
all:
  exit: 0
  transcript: "| mv"
---*)
