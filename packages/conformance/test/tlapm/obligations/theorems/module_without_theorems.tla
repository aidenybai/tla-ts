(*---
description: A module without theorems gives zero obligations and succeeds.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: proved
---*)
---- MODULE module_without_theorems ----
CONSTANT c
Op == c
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
