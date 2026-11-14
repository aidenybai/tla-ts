(*---
description: Without an explicit target, a module with no obligations is not an empty target and exits 0.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: proved
---*)
---- MODULE no_theorems_not_empty_target ----
CONSTANT c
AXIOM c = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
