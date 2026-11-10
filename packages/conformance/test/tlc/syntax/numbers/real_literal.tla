(*---
description: A decimal literal parses but TLC cannot evaluate it.
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
outcome: config-error
---*)
---- MODULE real_literal ----
ASSUME 1.5 = 1.5
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)
