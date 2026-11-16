(*---
description: "The pragma (*{suppress}*) before OBVIOUS suppresses its obligation."
ref: src/proof/p_parser.ml#suppress
mode: obligations
outcome: proved
---*)
---- MODULE suppressed_obvious ----
THEOREM TRUE
  (*{suppress}*) OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
