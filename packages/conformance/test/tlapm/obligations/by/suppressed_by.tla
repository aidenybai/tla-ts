(*---
description: "The suppress pragma (*{_}*) before BY suppresses all of its obligations, so the theorem gives none and the run is not incomplete."
ref: src/proof/p_gen.ml#collect
mode: obligations
outcome: proved
---*)
---- MODULE suppressed_by ----
THEOREM TRUE
  (*{_}*) BY TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
